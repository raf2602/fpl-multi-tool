import type {
  Bootstrap,
  LiveGw,
  LeagueStandings,
  EntryEvent,
  EntryHistory,
  LuckCalculation,
  CaptainROI,
  TransferImpact,
  ChipEffectiveness,
  WeeklyReview,
  LeagueTemplate,
  FixtureRun,
  Fixture,
} from './types';
import { median, mean, sum, sortBy } from './utils';

// Current gameweek calculation
export function currentGw(bootstrap: Bootstrap): number {
  const currentEvent = bootstrap.events.find(event => event.is_current);
  return currentEvent?.id || 1;
}

// Luck vs Median calculations
export function leagueMedian(pointsByEntry: number[]): number {
  return median(pointsByEntry);
}

export function calculateLuck(
  entryData: { entryId: number; gwPoints: number[] }[],
  gwCount: number
): LuckCalculation[] {
  const results: LuckCalculation[] = [];

  for (let gw = 1; gw <= gwCount; gw++) {
    // Get all points for this gameweek
    const gwPoints = entryData
      .map(entry => entry.gwPoints[gw - 1])
      .filter(points => points !== undefined) as number[];

    const medianPoints = leagueMedian(gwPoints);

    // Calculate luck for each entry
    entryData.forEach(entry => {
      const entryPoints = entry.gwPoints[gw - 1];
      if (entryPoints !== undefined) {
        let existing = results.find(r => r.entry_id === entry.entryId);
        if (!existing) {
          existing = {
            entry_id: entry.entryId,
            gw_points: [],
            median_points: [],
            luck_scores: [],
            cumulative_luck: 0,
          };
          results.push(existing);
        }

        const luckScore = entryPoints - medianPoints;
        existing.gw_points.push(entryPoints);
        existing.median_points.push(medianPoints);
        existing.luck_scores.push(luckScore);
        existing.cumulative_luck = sum(existing.luck_scores);
      }
    });
  }

  return results;
}

// Captain ROI calculations
export function calculateCaptainROI(
  entryEvents: (EntryEvent | null)[],
  liveData: LiveGw,
  bootstrap: Bootstrap
): CaptainROI[] {
  const results: CaptainROI[] = [];

  entryEvents.forEach((entryEvent, index) => {
    if (!entryEvent) return;

    const picks = entryEvent.picks;
    const captain = picks.find(pick => pick.is_captain);
    if (!captain) return;

    // Get captain points
    const captainLiveStats = liveData.elements.find(el => el.id === captain.element);
    const captainPoints = captainLiveStats?.stats.total_points || 0;

    // Find optimal captain (highest scoring player in the XI)
    let optimalCaptain = { element: captain.element, points: captainPoints };
    picks.slice(0, 11).forEach(pick => {
      const playerLiveStats = liveData.elements.find(el => el.id === pick.element);
      const playerPoints = playerLiveStats?.stats.total_points || 0;
      if (playerPoints > optimalCaptain.points) {
        optimalCaptain = { element: pick.element, points: playerPoints };
      }
    });

    // Calculate ROI (captain gets 2x points, so we compare 2*captain vs 2*optimal)
    const captainTotal = captainPoints * 2;
    const optimalTotal = optimalCaptain.points * 2;
    const roi = captainTotal - optimalTotal;

    results.push({
      gw: (entryEvent.entry_history as any).event || 0,
      entry_id: index + 1, // This would need to be passed in properly
      captain_id: captain.element,
      captain_points: captainTotal,
      optimal_captain_id: optimalCaptain.element,
      optimal_captain_points: optimalTotal,
      roi,
    });
  });

  return results;
}

// Effective Ownership calculations
export function calculateEffectiveOwnership(
  entryEvents: (EntryEvent | null)[],
  bootstrap: Bootstrap
): LeagueTemplate {
  const playerStats = new Map<number, { owned: number; captained: number }>();
  const totalEntries = entryEvents.filter(event => event !== null).length;

  // Count ownership and captaincy
  entryEvents.forEach(entryEvent => {
    if (!entryEvent) return;

    entryEvent.picks.forEach(pick => {
      const current = playerStats.get(pick.element) || { owned: 0, captained: 0 };
      current.owned += 1;
      if (pick.is_captain) {
        current.captained += 1;
      }
      playerStats.set(pick.element, current);
    });
  });

  // Calculate percentages and effective ownership
  const players = Array.from(playerStats.entries()).map(([elementId, stats]) => {
    const ownershipPercent = (stats.owned / totalEntries) * 100;
    const captaincyPercent = (stats.captained / totalEntries) * 100;
    const effectiveOwnership = ownershipPercent + captaincyPercent;

    return {
      element_id: elementId,
      ownership_percent: ownershipPercent,
      captaincy_percent: captaincyPercent,
      effective_ownership: effectiveOwnership,
    };
  });

  // Sort by effective ownership and get top 11
  const sortedPlayers = sortBy(players, p => -p.effective_ownership);
  const mostOwnedXI = sortedPlayers.slice(0, 11).map(p => p.element_id);

  return {
    players: sortedPlayers,
    most_owned_xi: mostOwnedXI,
  };
}

// Template overlap calculation
export function calculateTemplateOverlap(
  entryEvent: EntryEvent,
  template: LeagueTemplate,
  liveData: LiveGw
): { overlap: number; differentialPoints: number } {
  const entryPlayers = entryEvent.picks.slice(0, 11).map(pick => pick.element);
  const templatePlayers = template.most_owned_xi;

  // Calculate overlap
  const overlap = entryPlayers.filter(playerId => 
    templatePlayers.includes(playerId)
  ).length;

  // Calculate differential points (points from non-template players)
  const differentialPlayers = entryPlayers.filter(playerId => 
    !templatePlayers.includes(playerId)
  );

  let differentialPoints = 0;
  differentialPlayers.forEach(playerId => {
    const pick = entryEvent.picks.find(p => p.element === playerId);
    const liveStats = liveData.elements.find(el => el.id === playerId);
    const points = liveStats?.stats.total_points || 0;
    differentialPoints += points * (pick?.multiplier || 1);
  });

  return { overlap, differentialPoints };
}

// Transfer impact calculations
export function calculateTransferImpact(
  entryHistory: EntryHistory,
  entryEvents: EntryEvent[],
  liveData: { [gw: number]: LiveGw },
  bootstrap: Bootstrap
): TransferImpact[] {
  const results: TransferImpact[] = [];

  // This is a simplified version - in reality you'd need transfer data
  entryHistory.current.forEach((gwData, index) => {
    const gw = gwData.event;
    const entryEvent = entryEvents.find(ee => (ee.entry_history as any).event === gw);
    
    if (!entryEvent || !liveData[gw]) return;

    // For now, we'll estimate transfer impact based on transfer cost and points
    const transferCost = gwData.event_transfers_cost;
    const transferCount = gwData.event_transfers;

    if (transferCount > 0) {
      // This is a placeholder - proper calculation would need actual transfer data
      const estimatedGain = 0; // Would calculate from actual ins/outs
      const netImpact = estimatedGain - transferCost;

      results.push({
        gw,
        entry_id: 0, // Would need entry ID
        transfers_in: [], // Would populate from transfer data
        transfers_out: [], // Would populate from transfer data
        hit_cost: transferCost,
        net_impact: netImpact,
      });
    }
  });

  return results;
}

// Chip effectiveness calculations
export function calculateChipEffectiveness(
  entryHistory: EntryHistory,
  leagueStandings: LeagueStandings
): ChipEffectiveness[] {
  const results: ChipEffectiveness[] = [];

  entryHistory.chips.forEach(chip => {
    const gw = chip.event;
    const gwData = entryHistory.current.find(c => c.event === gw);
    
    if (!gwData) return;

    // Calculate effectiveness based on rank change
    const previousGwData = entryHistory.current.find(c => c.event === gw - 1);
    const rankChange = previousGwData 
      ? previousGwData.overall_rank - gwData.overall_rank 
      : 0;

    // Simple effectiveness score based on points and rank change
    const pointsGained = gwData.points;
    const effectivenessScore = pointsGained + (rankChange / 1000); // Normalize rank change

    results.push({
      chip_name: chip.name,
      gw,
      entry_id: 0, // Would need entry ID
      points_gained: pointsGained,
      rank_change: rankChange,
      effectiveness_score: effectivenessScore,
    });
  });

  return results;
}

// Weekly review calculations
export function calculateWeeklyReview(
  leagueStandings: LeagueStandings,
  entryEvents: (EntryEvent | null)[],
  liveData: LiveGw,
  gw: number
): WeeklyReview {
  const validEntries = entryEvents
    .map((event, index) => ({
      event,
      standing: leagueStandings.standings.results[index],
    }))
    .filter(item => item.event && item.standing);

  // Highest score
  const highestScore = validEntries.reduce((max, current) => {
    const points = current.event?.entry_history.points || 0;
    return points > (max.event?.entry_history.points || 0) ? current : max;
  }, validEntries[0]);

  // Biggest green arrow (best rank improvement)
  const biggestGreenArrow = validEntries.reduce((best, current) => {
    const rankChange = (current.standing?.last_rank || 0) - (current.standing?.rank || 0);
    const bestChange = (best.standing?.last_rank || 0) - (best.standing?.rank || 0);
    return rankChange > bestChange ? current : best;
  }, validEntries[0]);

  // Biggest red arrow (worst rank drop)
  const biggestRedArrow = validEntries.reduce((worst, current) => {
    const rankChange = (current.standing?.last_rank || 0) - (current.standing?.rank || 0);
    const worstChange = (worst.standing?.last_rank || 0) - (worst.standing?.rank || 0);
    return rankChange < worstChange ? current : worst;
  }, validEntries[0]);

  // Bench blunder (most points left on bench)
  const benchBlunder = validEntries.reduce((max, current) => {
    if (!current.event) return max;
    
    const benchPoints = current.event.picks.slice(11).reduce((total, pick) => {
      const liveStats = liveData.elements.find(el => el.id === pick.element);
      return total + (liveStats?.stats.total_points || 0);
    }, 0);

    const maxBenchPoints = max.event?.picks.slice(11).reduce((total, pick) => {
      const liveStats = liveData.elements.find(el => el.id === pick.element);
      return total + (liveStats?.stats.total_points || 0);
    }, 0) || 0;

    return benchPoints > maxBenchPoints ? current : max;
  }, validEntries[0]);

  // Captain fail (worst captain choice vs optimal)
  const captainFail = validEntries.reduce((worst, current) => {
    if (!current.event) return worst;

    const captain = current.event.picks.find(pick => pick.is_captain);
    if (!captain) return worst;

    const captainStats = liveData.elements.find(el => el.id === captain.element);
    const captainPoints = captainStats?.stats.total_points || 0;

    // Find best player in XI
    const bestInXI = current.event.picks.slice(0, 11).reduce((best, pick) => {
      const stats = liveData.elements.find(el => el.id === pick.element);
      const points = stats?.stats.total_points || 0;
      return points > best.points ? { element: pick.element, points } : best;
    }, { element: 0, points: 0 });

    const missedPoints = bestInXI.points - captainPoints;

    const worstEvent = worst.event;
    const worstCaptain = worstEvent?.picks.find(pick => pick.is_captain);
    let worstMissedPoints = 0;
    
    if (worstCaptain && worstEvent) {
      const worstCaptainStats = liveData.elements.find(el => el.id === worstCaptain.element);
      const worstCaptainPoints = worstCaptainStats?.stats.total_points || 0;
      const worstBestInXI = worstEvent.picks.slice(0, 11).reduce((best, pick) => {
        const stats = liveData.elements.find(el => el.id === pick.element);
        const points = stats?.stats.total_points || 0;
        return points > best.points ? { element: pick.element, points } : best;
      }, { element: 0, points: 0 });
      worstMissedPoints = worstBestInXI.points - worstCaptainPoints;
    }

    return missedPoints > worstMissedPoints ? current : worst;
  }, validEntries[0]);

  return {
    gw,
    highest_score: {
      entry_id: highestScore.standing?.entry || 0,
      score: highestScore.event?.entry_history.points || 0,
      entry_name: highestScore.standing?.entry_name || 'Unknown',
    },
    biggest_green_arrow: {
      entry_id: biggestGreenArrow.standing?.entry || 0,
      rank_change: (biggestGreenArrow.standing?.last_rank || 0) - (biggestGreenArrow.standing?.rank || 0),
      entry_name: biggestGreenArrow.standing?.entry_name || 'Unknown',
    },
    biggest_red_arrow: {
      entry_id: biggestRedArrow.standing?.entry || 0,
      rank_change: (biggestRedArrow.standing?.last_rank || 0) - (biggestRedArrow.standing?.rank || 0),
      entry_name: biggestRedArrow.standing?.entry_name || 'Unknown',
    },
    bench_blunder: {
      entry_id: benchBlunder.standing?.entry || 0,
      bench_points: benchBlunder.event?.picks.slice(11).reduce((total, pick) => {
        const liveStats = liveData.elements.find(el => el.id === pick.element);
        return total + (liveStats?.stats.total_points || 0);
      }, 0) || 0,
      entry_name: benchBlunder.standing?.entry_name || 'Unknown',
    },
    captain_fail: {
      entry_id: captainFail.standing?.entry || 0,
      captain_points: 0, // Would calculate properly
      optimal_points: 0, // Would calculate properly
      entry_name: captainFail.standing?.entry_name || 'Unknown',
    },
    eo_swing: {
      element_id: 0, // Would need to track EO changes
      eo_change: 0,
      player_name: 'Unknown',
    },
  };
}

// Fixture difficulty calculations
export function calculateFixtureRuns(
  fixtures: Fixture[],
  bootstrap: Bootstrap,
  gameweeksAhead: number = 5
): FixtureRun[] {
  const currentGwId = currentGw(bootstrap);
  const relevantFixtures = fixtures.filter(
    fixture => fixture.event && 
    fixture.event > currentGwId && 
    fixture.event <= currentGwId + gameweeksAhead
  );

  const teamRuns = bootstrap.teams.map(team => {
    const teamFixtures = relevantFixtures
      .filter(fixture => fixture.team_h === team.id || fixture.team_a === team.id)
      .map(fixture => {
        const isHome = fixture.team_h === team.id;
        const opponentId = isHome ? fixture.team_a : fixture.team_h;
        const opponent = bootstrap.teams.find(t => t.id === opponentId);
        const difficulty = isHome ? fixture.team_h_difficulty : fixture.team_a_difficulty;

        return {
          gw: fixture.event!,
          opponent: opponent?.short_name || 'Unknown',
          difficulty,
          is_home: isHome,
        };
      })
      .sort((a, b) => a.gw - b.gw);

    const averageDifficulty = teamFixtures.length > 0 
      ? mean(teamFixtures.map(f => f.difficulty))
      : 0;

    // Find blank and double gameweeks
    const gameweekCounts = new Map<number, number>();
    teamFixtures.forEach(fixture => {
      gameweekCounts.set(fixture.gw, (gameweekCounts.get(fixture.gw) || 0) + 1);
    });

    const blankGws: number[] = [];
    const doubleGws: number[] = [];

    for (let gw = currentGwId + 1; gw <= currentGwId + gameweeksAhead; gw++) {
      const count = gameweekCounts.get(gw) || 0;
      if (count === 0) blankGws.push(gw);
      if (count > 1) doubleGws.push(gw);
    }

    return {
      team_id: team.id,
      team_name: team.name,
      fixtures: teamFixtures,
      average_difficulty: averageDifficulty,
      blank_gws: blankGws,
      double_gws: doubleGws,
    };
  });

  return sortBy(teamRuns, run => run.average_difficulty);
}

// Utility functions for calculations

export function calculatePlayerForm(
  element: Bootstrap['elements'][0],
  recentGws: number = 5
): {
  form: number;
  pointsPerGame: number;
  trend: 'up' | 'down' | 'stable';
} {
  const form = parseFloat(element.form);
  const pointsPerGame = parseFloat(element.points_per_game);
  
  // Simple trend calculation based on form vs PPG
  let trend: 'up' | 'down' | 'stable' = 'stable';
  if (form > pointsPerGame * 1.1) trend = 'up';
  else if (form < pointsPerGame * 0.9) trend = 'down';

  return { form, pointsPerGame, trend };
}

export function calculateTeamStrength(
  team: Bootstrap['teams'][0],
  fixtures: Fixture[]
): {
  attackStrength: number;
  defenseStrength: number;
  overallStrength: number;
  form: number;
} {
  return {
    attackStrength: (team.strength_attack_home + team.strength_attack_away) / 2,
    defenseStrength: (team.strength_defence_home + team.strength_defence_away) / 2,
    overallStrength: (team.strength_overall_home + team.strength_overall_away) / 2,
    form: team.points / team.played, // Points per game
  };
}

export function rankEntries<T extends { points?: number; total?: number }>(
  entries: T[]
): (T & { rank: number })[] {
  const sorted = [...entries].sort((a, b) => (b.total || b.points || 0) - (a.total || a.points || 0));
  
  return sorted.map((entry, index) => ({
    ...entry,
    rank: index + 1,
  }));
}
