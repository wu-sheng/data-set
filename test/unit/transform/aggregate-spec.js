const simpleStatistics = require('simple-statistics');
const {
  each,
  forIn,
  groupBy,
  map,
  uniq
} = require('lodash');
const {
  expect
} = require('chai');
const {
  DataSet,
  getTransform
} = require('../../../index');
const {
  VALID_AGGREGATES
} = require('../../../src/transform/aggregate');

describe('DataView.transform(): aggregate', () => {
  const data = [];
  for (let i = 1; i <= 10; i++) {
    // 1~10
    const b = i % 2;
    data.push({
      a: i,
      b
    });
  }
  const ds = new DataSet();
  let dv;
  beforeEach(() => {
    dv = ds.createView().source(data);
  });

  it('api', () => {
    expect(getTransform('aggregate')).to.be.a('function');
  });

  it('default: count', () => {
    dv.transform({
      type: 'aggregate'
    });
    expect(dv.rows.length).to.equal(1);
    expect(dv.rows[0]).to.eql({
      count: 10
    });
  });

  it('all', () => {
    dv.transform({
      type: 'aggregate',
      fields: map(VALID_AGGREGATES, () => 'a'),
      groupBy: [ 'b' ],
      operations: VALID_AGGREGATES,
      as: VALID_AGGREGATES
    });
    const groups = groupBy(data, row => row.b);
    const partitions = [[], []];
    forIn(groups, (group, i) => {
      partitions[i] = map(group, row => row.a);
    });
    const results = map(partitions, (part, i) => {
      const result = {
        b: groups[i][0].b
      };
      each(VALID_AGGREGATES, operation => {
        if (simpleStatistics[operation]) {
          result[operation] = simpleStatistics[operation](part);
        } else if (operation === 'count') {
          result.count = part.length;
        } else if (operation === 'distinct') {
          result.distinct = uniq(part).length;
        }
      });
      return result;
    });
    expect(dv.rows).to.eql(results);
  });
});

describe('DataView.transform(): aggregate: performance of partition', () => {
  const top2000 = require('../../fixtures/top2000.json');
  const t1 = Date.now();
  const ds = new DataSet();
  const dv = ds.createView('test').source(top2000);
  const t2 = Date.now();
  dv.transform({
    as: [ 'count' ],
    groupBy: [ 'release' ],
    operations: [ 'count' ],
    type: 'aggregate'
  });
  const t3 = Date.now();
  it('deepClone should be done in less than 300ms', () => {
    expect((t2 - t1) < 300).to.equal(true);
  });
  it('partition should be done in less than 200ms', () => {
    expect((t3 - t2) < 200).to.equal(true);
  });
  it('it should be done in less than 500ms in total', () => {
    expect((t3 - t1) < 500).to.equal(true);
  });
});
