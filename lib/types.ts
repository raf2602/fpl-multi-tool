export type GwId = number;

export type Bootstrap = {
  events: { 
    id: number; 
    is_current: boolean; 
    is_next: boolean; 
    name: string;
    deadline_time: string;
    finished: boolean;
    data_checked: boolean;
    highest_scoring_entry: number | null;
    deadline_time_epoch: number;
    deadline_time_game_offset: number;
    highest_score: number | null;
    is_previous: boolean;
    can_enter: boolean;
    transfers_made: number;
    h2h_ko_matches_created: boolean;
    chip_plays: { chip_name: string; num_played: number }[];
    most_selected: number | null;
    most_transferred_in: number | null;
    top_element: number | null;
    top_element_info: { id: number; points: number } | null;
    transfers_made_total: number;
    most_captained: number | null;
    most_vice_captained: number | null;
  }[];
  elements: { 
    id: number; 
    web_name: string; 
    team: number; 
    element_type: number; 
    now_cost: number; 
    selected_by_percent: string;
    first_name: string;
    second_name: string;
    total_points: number;
    event_points: number;
    form: string;
    points_per_game: string;
    status: string;
    code: number;
    cost_change_event: number;
    cost_change_event_fall: number;
    cost_change_start: number;
    cost_change_start_fall: number;
    dreamteam_count: number;
    in_dreamteam: boolean;
    news: string;
    news_added: string | null;
    photo: string;
    special: boolean;
    squad_number: number | null;
    transfers_in: number;
    transfers_in_event: number;
    transfers_out: number;
    transfers_out_event: number;
    value_form: string;
    value_season: string;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    starts: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
    influence_rank: number;
    influence_rank_type: number;
    creativity_rank: number;
    creativity_rank_type: number;
    threat_rank: number;
    threat_rank_type: number;
    ict_index_rank: number;
    ict_index_rank_type: number;
    corners_and_indirect_freekicks_order: number | null;
    corners_and_indirect_freekicks_text: string;
    direct_freekicks_order: number | null;
    direct_freekicks_text: string;
    penalties_order: number | null;
    penalties_text: string;
    expected_goals_per_90: number;
    saves_per_90: number;
    expected_assists_per_90: number;
    expected_goal_involvements_per_90: number;
    expected_goals_conceded_per_90: number;
    goals_conceded_per_90: number;
    now_cost_rank: number;
    now_cost_rank_type: number;
    form_rank: number;
    form_rank_type: number;
    points_per_game_rank: number;
    points_per_game_rank_type: number;
    selected_rank: number;
    selected_rank_type: number;
    starts_per_90: number;
    clean_sheets_per_90: number;
  }[];
  teams: { 
    id: number; 
    name: string; 
    short_name: string;
    code: number;
    draw: number;
    form: string | null;
    loss: number;
    played: number;
    points: number;
    position: number;
    strength: number;
    team_division: string | null;
    unavailable: boolean;
    win: number;
    strength_overall_home: number;
    strength_overall_away: number;
    strength_attack_home: number;
    strength_attack_away: number;
    strength_defence_home: number;
    strength_defence_away: number;
    pulse_id: number;
  }[];
  element_types: { 
    id: number; 
    singular_name_short: string;
    singular_name: string;
    plural_name: string;
    plural_name_short: string;
    element_count: number;
    ui_shirt_specific: boolean;
    sub_positions_locked: number[];
    squad_select: number;
    squad_min_play: number;
    squad_max_play: number;
  }[];
  total_players: number;
};

export type LiveGw = { 
  elements: { 
    id: number; 
    stats: { 
      total_points: number; 
      bps: number;
      minutes: number;
      goals_scored: number;
      assists: number;
      clean_sheets: number;
      goals_conceded: number;
      own_goals: number;
      penalties_saved: number;
      penalties_missed: number;
      yellow_cards: number;
      red_cards: number;
      saves: number;
      bonus: number;
      influence: string;
      creativity: string;
      threat: string;
      ict_index: string;
      starts: number;
      expected_goals: string;
      expected_assists: string;
      expected_goal_involvements: string;
      expected_goals_conceded: string;
    };
  }[];
};

export type LeagueStandings = {
  league: { 
    id: number; 
    name: string;
    created: string;
    closed: boolean;
    max_entries: number | null;
    league_type: string;
    scoring: string;
    admin_entry: number | null;
    start_event: number;
    code_privacy: string;
    has_cup: boolean;
    cup_league: number | null;
    rank: number | null;
  };
  standings: { 
    has_next: boolean;
    page: number;
    results: { 
      entry: number; 
      player_name: string; 
      entry_name: string; 
      total: number;
      id: number;
      event_total: number;
      rank: number;
      last_rank: number;
      rank_sort: number;
      start_event: number;
      stop_event: number;
    }[];
  };
};

export type EntryEvent = {
  active_chip: string | null;
  automatic_subs: {
    element_in: number;
    element_out: number;
    event: number;
  }[];
  entry_history: { 
    points: number; 
    total_points: number; 
    rank: number; 
    event_transfers_cost: number;
    event_transfers: number;
    value: number;
    bank: number;
    points_on_bench: number;
  };
  picks: { 
    element: number; 
    position: number;
    multiplier: number; 
    is_captain: boolean; 
    is_vice_captain: boolean;
  }[];
};

export type EntryHistory = {
  chips: { 
    name: string; 
    event: number;
  }[];
  current: { 
    event: number; 
    points: number; 
    total_points: number; 
    overall_rank: number;
    rank: number;
    rank_sort: number;
    event_transfers: number;
    event_transfers_cost: number;
    value: number;
    bank: number;
    points_on_bench: number;
  }[];
  past: {
    season_name: string;
    total_points: number;
    rank: number;
  }[];
};

export type Entry = { 
  id: number; 
  summary_overall_points: number; 
  value: number; 
  bank: number;
  summary_overall_rank: number;
  summary_event_points: number;
  summary_event_rank: number;
  current_event: number;
  joined_time: string;
  started_event: number;
  favourite_team: number | null;
  player_first_name: string;
  player_last_name: string;
  player_region_id: number;
  player_region_name: string;
  player_region_iso_code_short: string;
  player_region_iso_code_long: string;
  name: string;
  kit: string | null;
  last_deadline_bank: number;
  last_deadline_value: number;
  last_deadline_total_transfers: number;
};

export type EntryTransfers = {
  element_in: number;
  element_in_cost: number;
  element_out: number;
  element_out_cost: number;
  entry: number;
  event: number;
  time: string;
}[];

export type Fixture = {
  code: number;
  event: number | null;
  finished: boolean;
  finished_provisional: boolean;
  id: number;
  kickoff_time: string | null;
  minutes: number;
  provisional_start_time: boolean;
  started: boolean | null;
  team_a: number;
  team_a_score: number | null;
  team_h: number;
  team_h_score: number | null;
  stats: {
    identifier: string;
    a: { value: number; element: number }[];
    h: { value: number; element: number }[];
  }[];
  team_h_difficulty: number;
  team_a_difficulty: number;
  pulse_id: number;
};

export type ElementSummary = {
  fixtures: {
    id: number;
    code: number;
    team_h: number;
    team_h_score: number | null;
    team_a: number;
    team_a_score: number | null;
    event: number | null;
    finished: boolean;
    minutes: number;
    provisional_start_time: boolean;
    kickoff_time: string | null;
    event_name: string;
    is_home: boolean;
    difficulty: number;
  }[];
  history: {
    element: number;
    fixture: number;
    opponent_team: number;
    total_points: number;
    was_home: boolean;
    kickoff_time: string;
    team_h_score: number;
    team_a_score: number;
    round: number;
    value: number;
    transfers_balance: number;
    selected: number;
    transfers_in: number;
    transfers_out: number;
    loaned_in: number;
    loaned_out: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    starts: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
  }[];
  history_past: {
    season_name: string;
    element_code: number;
    start_cost: number;
    end_cost: number;
    total_points: number;
    minutes: number;
    goals_scored: number;
    assists: number;
    clean_sheets: number;
    goals_conceded: number;
    own_goals: number;
    penalties_saved: number;
    penalties_missed: number;
    yellow_cards: number;
    red_cards: number;
    saves: number;
    bonus: number;
    bps: number;
    influence: string;
    creativity: string;
    threat: string;
    ict_index: string;
    starts: number;
    expected_goals: string;
    expected_assists: string;
    expected_goal_involvements: string;
    expected_goals_conceded: string;
  }[];
};

// Internal types for calculations
export type SessionContext = {
  cookies: string;
};

export type SessionData = { 
  cookies: string; 
  expiresAt: number; 
};

export type EntryWithPicks = {
  entry: Entry;
  picks: EntryEvent['picks'];
  history: EntryEvent['entry_history'];
};

export type PlayerWithStats = Bootstrap['elements'][0] & {
  live_stats?: LiveGw['elements'][0]['stats'];
};

export type LeagueTemplate = {
  players: {
    element_id: number;
    ownership_percent: number;
    captaincy_percent: number;
    effective_ownership: number;
  }[];
  most_owned_xi: number[];
};

export type CaptainROI = {
  gw: number;
  entry_id: number;
  captain_id: number;
  captain_points: number;
  optimal_captain_id: number;
  optimal_captain_points: number;
  roi: number;
};

export type TransferImpact = {
  gw: number;
  entry_id: number;
  transfers_in: { element_id: number; cost: number; points: number }[];
  transfers_out: { element_id: number; cost: number; points: number }[];
  hit_cost: number;
  net_impact: number;
};

export type ChipEffectiveness = {
  chip_name: string;
  gw: number;
  entry_id: number;
  points_gained: number;
  rank_change: number;
  effectiveness_score: number;
};

export type WeeklyReview = {
  gw: number;
  highest_score: { entry_id: number; score: number; entry_name: string };
  biggest_green_arrow: { entry_id: number; rank_change: number; entry_name: string };
  biggest_red_arrow: { entry_id: number; rank_change: number; entry_name: string };
  bench_blunder: { entry_id: number; bench_points: number; entry_name: string };
  captain_fail: { entry_id: number; captain_points: number; optimal_points: number; entry_name: string };
  eo_swing: { element_id: number; eo_change: number; player_name: string };
};

export type LuckCalculation = {
  entry_id: number;
  gw_points: number[];
  median_points: number[];
  luck_scores: number[];
  cumulative_luck: number;
};

export type FixtureRun = {
  team_id: number;
  team_name: string;
  fixtures: {
    gw: number;
    opponent: string;
    difficulty: number;
    is_home: boolean;
  }[];
  average_difficulty: number;
  blank_gws: number[];
  double_gws: number[];
};
