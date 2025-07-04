export interface Mob {
  id?: number;
  category: number;
  name: string;
  displayName: string;
  subTitle: string;
  mobType: number;
  display1: string;
  display2: string;
  display3: string;
  display4: string;
  scale: number;
  hitbox: number;
  baseAnimationState: number;
  faction: number;
  attackable: boolean;
  minLevel: number;
  maxLevel: number;
  species: string;
  subSpecies: string;
  skinningLootTable: number;
  skinningLevelReq: number;
  skinningLevelMax: number;
  skinningSkillId: number;
  skinningSkillExp: number;
  skinningWeaponReq: string;
  skinningHarvestTime: number;
  questCategory: string;
  specialUse: string;
  speed_walk: number;
  speed_run: number;
  minDmg: number;
  maxDmg: number;
  attackSpeed: number;
  dmgType: string;
  //primaryWeapon: number;
  //secondaryWeapon: number;
  //autoAttack: number;
  //attackDistance: number;
  //ability0: number;
  //abilityStatReq0: string;
  //abilityStatPercent0: number;
  //ability1: number;
  //abilityStatReq1: string;
  //abilityStatPercent1: number;
  //ability2: number;
  //abilityStatReq2: string;
  //abilityStatPercent2: number;
  exp: number;
  addExplev: number;
  aggro_radius: number;
  send_link_aggro: boolean;
  get_link_aggro: boolean;
  link_aggro_range: number;
  chasing_distance: number;
  behavior_profile_id: number;
  stat_profile_id: number;
  tags: number;
  pet_count_stat: number,
  race_id: number,
  class_id: number,
  gender_id: number,
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
  stats?: MobStat[];
  loot?: MobLoot[];
}
export interface MobStat {
  id?: number;
  mobTemplate: number;
  stat: string;
  value: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}
export interface MobLoot {
  id?: number;
  category: number;
  mobTemplate: number;
  lootTable: number;
  dropChance: number;
  count: number;
  isactive: boolean;
  creationtimestamp: string;
  updatetimestamp: string;
}
export const mobsDefaults: Partial<Mob> = {
  hitbox: 0,
  speed_walk: 0,
  speed_run: 0,
  baseAnimationState: 1,
  exp: 0,
  addExplev: 0,
  minLevel: 1,
  maxLevel: 1,
  minDmg: 0,
  maxDmg: 0,
  attackable: false,
  aggro_radius: 1,
  chasing_distance: 60,
  link_aggro_range: 0,
  send_link_aggro: false,
  get_link_aggro: false,
  //attackDistance: 0,
  attackSpeed: 1.7,
  //abilityStatPercent0: 0,
  //abilityStatPercent1: 0,
  //abilityStatPercent2: 0,
  skinningLevelReq: 0,
  skinningLevelMax: 0,
  skinningSkillExp: 0,
};
