enum EntityType {
  BUILDING = 'BUILDING',
  FLOOR = 'FLOOR',
  UNIT = 'UNIT',
}

export interface Entity {
  maxID?: string;
  name: string;
  type: EntityType;
  parent?: Entity;
  children: Array<Entity>;
}

export const listing = {
  name: 'BLD_A',
  type: EntityType.BUILDING,
  children: [
    {
      name: 'Lvl_00',
      maxID: '10',
      type: EntityType.FLOOR,
    },
    {
      name: 'Lvl_01',
      maxID: '11',
      type: EntityType.FLOOR,
    },
    {
      name: 'Lvl_02',
      maxID: '12',
      type: EntityType.FLOOR,
      children: [
        {
          name: 'Unit_00',
          maxID: '1000',
          type: EntityType.UNIT,
          parent: {
            name: 'Lvl_02',
            maxID: '12',
            type: EntityType.FLOOR,
          },
        },
        {
          name: 'Unit_01',
          maxID: '1001',
          type: EntityType.UNIT,
          parent: {
            name: 'Lvl_02',
            maxID: '12',
            type: EntityType.FLOOR,
          },
        },
        {
          name: 'Unit_04',
          maxID: '1004',
          type: EntityType.UNIT,
          parent: {
            name: 'Lvl_02',
            maxID: '12',
            type: EntityType.FLOOR,
          },
        },
        {
          name: 'Unit_03',
          maxID: '1003',
          type: EntityType.UNIT,
          parent: {
            name: 'Lvl_02',
            maxID: '12',
            type: EntityType.FLOOR,
          },
        },
      ],
    },
    {
      name: 'Lvl_03',
      maxID: '13',
      type: EntityType.FLOOR,
    },
    {
      name: 'Lvl_04',
      maxID: '14',
      type: EntityType.FLOOR,
    },
    {
      name: 'Lvl_05',
      maxID: '15',
      type: EntityType.FLOOR,
    },
  ],
};
