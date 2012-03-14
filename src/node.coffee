###
A Node instance represents a node in a tree.
###
module.exports = class Node
  
  ###
  Initialises the Node and sets up the DOM element with given `label`.
  ###
  constructor: (label) ->
    @depth    = 0
    @tree     = null
    @parent   = null
    @children = []
    
    @$elem  = $('<li/>').addClass('node').attr('data-depth', @depth).data 'node', @
    @$edge  = $('<canvas/>').addClass('edge').attr(width: 0, height: 0).appendTo @$elem
    @$label = $('<span/>').addClass('label').appendTo @$elem
    @$label.text label
  
  ###
  Inserts a child `node` into this node's children at given `index`.  If `index`
  isn't given, `node` is appended to the children.
  ###
  insert_child: (node, index = @children.length) ->
    node.depth               = @depth + 1
    node.tree                = @tree
    node.parent              = @
    node.$elem.attr 'data-depth', node.depth
    @children[index...index] = node
  
  ###
  Removes the given `node` from this node's children.
  ###
  remove_child: (node) ->
    node.depth  = 0
    node.tree   = null
    node.parent = null
    node.$elem.attr 'node-depth', 0
    @children.splice @children.indexOf(node), 1
  
  ###
  Returns the index of this node in its parent's children.
  ###
  index: ->
    @parent?.children.indexOf @
  
  ###
  Returns all this node's parents.
  ###
  parents: ->
    parent while parent = (parent ? @).parent
  
  ###
  Returns all the nodes in this node's subtree (including this node).
  ###
  subtree_nodes: ->
    nodes = [@]
    nodes = nodes.concat child.subtree_nodes() for child in @children
    return nodes
  
  ###
  Returns all this node's siblings.
  ###
  siblings: ->
    return [] unless @parent
    @parent.children[...@index()].concat @parent.children[@index() + 1...]
  
  ###
  Returns this node's first previous sibling.
  ###
  previous_sibling: ->
    @parent?.children[@index() - 1]
  
  ###
  Returns all this node's previous siblings.
  ###
  previous_siblings: ->
    @parent?.children[0...@index()] ? []
  
  ###
  Returns the roots of all this node's previous subtrees.
  ###
  previous_subtrees: ->
    @previous_siblings().concat @parent?.previous_subtrees() ? []
  
  ###
  Returns this node's first next sibling.
  ###
  next_sibling: ->
    @parent?.children[@index() + 1]
  
  ###
  Returns all this node's next siblings.
  ###
  next_siblings: ->
    @parent?.children[index() + 1...] ? []
  
  ###
  Returns the roots of all this node's next subtrees.
  ###
  next_subtrees: ->
    @next_siblings().concat @parent?.next_subtrees() ? []
  
  ###
  Computes a JSON representation of the Node - simply the label.
  ###
  toJSON: ->
    @$label.text()