# Tree

[Example](http://connec.github.com/tree/example/).

Tree is a small library for creating animated space trees similar to those
available in the [Javascript InfoVis Toolkit](http://thejit.org/), with a
slightly different API and ground-up support for node ordering.

Tree depends on [jQuery](http://jquery.com/) and
[async](https://github.com/caolan/async).

## Sample Usage

To use the library simply include it and its dependencies in a `script` tag
somewhere, as well as setting the styles you want for the nodes.

```html
<style>
  .tree {
    position: relative;
  }
  .tree .wrapper {
    position: absolute;
    margin: 0;
    padding: 0;
    list-style: none;
  }
  .tree .wrapper .node {
    display: block;
    position: absolute;
  }
    .tree .wrapper .node .edge {
      position: absolute;
    }
</style>
<script src='jquery.js'></script>
<script src='async.js'></script>
<script src='tree.js'></script>
```

The `Tree` class will then be available on the window object.  You can then
create a new tree instance, passing the element you want to contain the tree to
the constructor.

```javascript
var tree = new Tree($('#tree'));
```

Then, create a root node for the tree.

```javascript
tree.set_root('Label For Root');
```

Centre the visualisation on the root.

```javascript
tree.set_centre(tree.root);
```

And, finally, update the visualisation.

```javascript
tree.refresh();
```

Insertion and removal of nodes can be animated, and callbacks can be executed
when animations complete.

```javascript
var node = tree.insert_node('New Node', tree.root);
tree.animate();

tree.bind('anim:after', function() {
  tree.remove_node(node);
  tree.animate();
});
```

For a more advanced example, see
[the example](http://connec.github.com/tree/example/).

## API

- `Tree::constructor($container, options = {})`
  
  Instantiates a new Tree instance.  The `$container` should be a jQuery object
  containing the element in which to display the tree.  Possible options are:
  
  - `child_offset = 'bottom'|'left'|'right'|'top'` : The edge from which children
    are offset.
  - `level_offset = 'bottom'|'left'|'right'|'top'` : The edge from which levels
      are offset.
  - `breadth = 'height'|'width'` : The actual dimension for the 'breadth' of the
    tree.  This is the width for a vertical tree (e.g. level offset is
    `top` or `bottom`) or the 'height' for a horizontal tree (as in the example).
  - `height = 'height'|'width'` : The actual dimension for the 'height' of the
    tree.  This is always the opposite of `breadth`.
  - `child_spacing = integer` : The number of pixels gap between children.
  - `level_spacing = integer` : The number of pixels gap between levels.
  - `edge_curvature = float` : The degree to which the edges should be curved.
    `0` would result in straight lines whereas `1` would result in a sharp corner.

- `Tree::set_root(label_or_node)`
  
  Changes the root node to the given `node`, or a new node with given `label`.
  This clears the tree of any existing nodes.

- `Tree::set_centre(node)`
  
  Sets the centre for the visualisation to the given `node`, so that any calls 
  to `refresh` or `animate` will place the `node` in the centre of the
  tree's container.
  
  *Note:* The visualisation will not centre until the next call to `refresh` or
  `animate`.

- `Tree::insert_node(node_or_label, context, index = null)`
  
  Inserts the given `node` (or a new node with given `label`) as child of the
  `context` node at the given `index`.  If `index` is null, the `node` is
  appended.
  
  *Note:* Inserted nodes will not display until a call is made to `refresh` or
  `animate`.

- `Tree::remove_node(node)`
  
  Removes the given `node` from the tree.
  
  *Note:* Removed nodes will not dissapear until a call is made to `refresh` or
  `animate`.

- `Tree::refresh()`
  
  Synchronously updates the visualisation with any queued insertions, removals
  or centre-ings.

- `Tree::animate()`
  
  Asynchronously animates any queued insertions, removals or centre-ings.  To
  execute a callback once the animation is complete it can be bound to the
  `anim:after` event (see Events below).

- `Tree:bind(event, callback)`
  
  Adds the given `callback` as a listener for `event`.

- `Tree::bind_once(event, callback)`
  
  Adds a callback to `event` that executes the given `callback` before removing
  itself from the listeners, so it is executed only on the first occurence of
  `event`.

- `Tree::unbind(event, callback = null)`
  
  Removes `callback` from the listeners for `event` if it is given.  Otherwise
  all listeners for `event` are removed.

## Events

Tree instances emit the following events.

- `anim:after` : Emitted after an animation (started with `animate`) has
  completed.  Callbacks are given no arguments.
- `node:add` : Emitted whenever a node is added to the tree with `insert_node`.
  Callbacks are given `(node, context)` as arguments (`context` may be null if
  the node being added is the root).  This is useful for adding additional data
  to nodes for future processing.
- `node:click` : Emitted when a node's label is clicked.  Callbacks are given
  the node whose label was clicked.
- `node:remove` : Emitted when a node is removed from the tree with
  `remove_node`.  Callbacks are given the node being removed.

*Note:* Returning `false` from any callback will stop any other callbacks for
that event taking place.  Additionally, retuning `false` from a `node:add` or
`node:remove` callback will stop the node being added/removed.

## Nodes

Nodes have several self-explanatory methods for traversing the tree.

- `Node::index()` : Returns the index of the node within its parent's children.
- `Node::parents()` : Returns an array of the node's parents, ordered from
  closest to furthest.
- `Node::subtree_nodes()` : Returns an array of all the nodes in the node's
  subtree (the node and the subtrees of all its children).
- `Node::siblings()` : Returns an array of all the node's siblings, ordered from
  furthest previous sibling to furthest next sibling.
- `Node::previous_sibling()/Node::next_sibling()` : Returns the immediate
  previous/next sibling.
- `Node::previous_siblings()/Node::next_siblings()` : Returns all previous/next
  siblings.
- `Node::previous_subtrees()/Node::next_subtrees()` : Returns the roots of all
  subtrees before/after the node.