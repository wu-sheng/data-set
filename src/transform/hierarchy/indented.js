const TreeLayout = require('./layout/base');
const indentedTree = require('./layout/indented');
const assign = require('lodash/assign');
const separateTree = require('./layout/separate-root');
// const isArray = require('lodash/isArray');
const {
  HIERARCHY,
  registerTransform
} = require('../../data-set');

const VALID_DIRECTIONS = [
  'LR', // left to right
  'RL', // right to left
  'H' // horizontal
];
const DEFAULT_DIRECTION = VALID_DIRECTIONS[0];

class IndentedLayout extends TreeLayout {
  execute() {
    const me = this;
    const options = me.options;
    const root = me.rootNode;
    options.isHorizontal = true;
    const indent = options.indent;
    const direction = options.direction || DEFAULT_DIRECTION;
    if (direction && VALID_DIRECTIONS.indexOf(direction) === -1) {
      throw new TypeError(`Invalid direction: ${direction}`);
    }
    if (direction === VALID_DIRECTIONS[0]) { // LR
      indentedTree(root, indent);
    } else if (direction === VALID_DIRECTIONS[1]) { // RL
      indentedTree(root, indent);
      root.right2left();
    } else if (direction === VALID_DIRECTIONS[2]) { // H
      // separate into left and right trees
      const { left, right } = separateTree(root, options);
      indentedTree(left, indent);
      left.right2left();
      indentedTree(right, indent);
      const bbox = left.getBoundingBox();
      right.translate(bbox.width, 0);
      root.x = right.x - root.width / 2;
    }
    return root;
  }
}

const DEFAULT_OPTIONS = {
};

function transform(dataView, options) {
  const root = dataView.root;
  options = assign({}, DEFAULT_OPTIONS, options);

  if (dataView.dataType !== HIERARCHY) {
    throw new TypeError('Invalid DataView: This transform is for Hierarchy data only!');
  }

  const rootNode = new IndentedLayout(root, options).execute();
  dataView.root = rootNode;
}

registerTransform('hierarchy.indented', transform);
registerTransform('indented-tree', transform);
