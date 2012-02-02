Node = require './node'

###
A Tree instance manages a single tree visualisation.
###
module.exports = class Tree
  
  ###
  The default options.
  ###
  @options =
    child_offset:   'top'
    level_offset:   'right'
    breadth:        'height'
    height:         'width'
    child_spacing:  5
    level_spacing:  50
    edge_curvature: 0.5
  
  ###
  The default (empty) callbacks.
  ###
  @callbacks =
    'anim:after' : []
    'edge:draw'  : []
    'node:add'   : []
    'node:click' : []
    'node:remove': []
  
  ###
  The default (empty) caches.
  ###
  get_empty_cache = -> keys: [], values: []
  @caches =
    child_offset:    get_empty_cache()
    level_offset:    get_empty_cache()
    subtree_breadth: get_empty_cache()
    level_height:    get_empty_cache()
  
  ###
  Initialises the Tree and sets up the container element.
  ###
  constructor: (@$container, options = {}) ->
    @options    = $.extend true, {}, @constructor.options, options
    @callbacks  = $.extend true, {}, @constructor.callbacks
    @root       = null
    @centre     = null
    @clear_cache()
    
    # Keep track of changes between calls to `refresh` or `animate`.
    @insertions = []
    @removals   = []
    
    @$container = $(@$container).addClass 'tree'
    @$wrapper   = $('<ul/>').addClass('wrapper').appendTo @$container
    
    @$container.bind 'click.tree', (event) =>
      if node = $(event.target).closest('.label').parent().data('node')
        @trigger 'node:click', node
  
  ###
  Sets the root of the tree.  If the tree already has a root it will be removed
  and returned.
  ###
  set_root: (node) ->
    node = new Node node unless node instanceof Node
    
    # Trigger the node:add callback to see if we should continue
    return false if @trigger('node:add', node, null) is false
    
    @$wrapper.find('*').remove()
    @$wrapper.append node.$elem
    [old_root, @root] = [@root, node]
    return old_root
  
  ###
  Sets the centre of the tree.
  ###
  set_centre: (node) ->
    @centre = node
  
  ###
  Inserts a new node into the given `context`s children at `index`.  If `index`
  isn't given `node` is appended.
  ###
  insert_node: (node, context, index = null) ->
    node = new Node node unless node instanceof Node
    
    # Trigger the node:add callback to see if we should continue
    return false if @trigger('node:add', node, context) is false
    
    # Actually insert the node
    @insertions = @insertions.concat node.subtree_nodes()
    context.insert_child node, index
    
  ###
  Removes a node from the tree.
  ###
  remove_node: (node) ->
    # Trigger the node:remove callback to see if we should continue
    return false if @trigger('node:remove', node) is false
    
    # Actually remove the node
    @removals = @removals.concat node.subtree_nodes()
    node.parent.remove_child node
  
  ###
  Refreshes the tree visualisation.
  ###
  refresh: ->
    node.$elem.remove() for node in @removals
    
    styles = @layout()
    @$wrapper.css styles.wrapper
    for {node, elem} in styles.nodes
      node.$elem.css elem
      node.$elem.fadeTo 0, 1
      @draw_edge node
    
    @insertions = []
    @removals   = []
    return @
  
  ###
  Computes the layout of the tree and animates the transition from the current
  state to the new layout.
  ###
  animate: ->
    async.forEach @removals, (node, done) ->
      node.$elem.fadeTo 500, 0, ->
        $(@).remove()
        done()
    , =>
      # Finished fading
      styles = @layout()
      async.parallel [
        (done) =>
          @$wrapper.animate styles.wrapper, complete: done
        (done) =>
          async.forEach styles.nodes, ({node, elem}, done) =>
            # Animate the node then fade it in
            node.$elem.animate elem,
              complete: ->
                node.$elem.fadeTo 500, 1, done
              step: =>
                @draw_edge node
          , done
      ], =>
        # Finished animating
        @insertions = []
        @removals   = []
        @trigger 'anim:after'
    
    return @
  
  ###
  Performs the layout computations common to both refresh and animate.
  ###
  layout: ->
    # Add all inserted nodes to the DOM, invisible, so their dimensions are
    # available.
    @$wrapper.append node.$elem.fadeTo(0, 0) for node in @insertions
    
    # Clear the cache of previous values
    @clear_cache()
    
    styles =
      wrapper: {}
      nodes:   []
    
    # Compute the properties
    for node in @root.subtree_nodes()
      css = {node, elem: {}, edge: {}}
      css.elem[@options.child_offset] = @get_child_offset node
      css.elem[@options.level_offset] = @get_level_offset node
      css.edge[@options.child_offset] = -css.elem[@options.child_offset]
      css.edge[@options.level_offset] = -@options.level_spacing
      styles.nodes.push css
      
      # Set the wrapper css to centre on this node
      if @centre == node
        styles.wrapper[@options.child_offset] = (@$container[@options.breadth]() - node.$elem[@options.breadth]()) / 2 - css.elem[@options.child_offset]
        styles.wrapper[@options.level_offset] = (@$container[@options.height]() - node.$elem[@options.height]()) / 2 - css.elem[@options.level_offset]
    
    return styles
  
  ###
  Redraws the edge of the given node.
  ###
  draw_edge: (node) ->
    return unless node.parent
    
    $node   = node.$elem
    $edge   = node.$edge
    $parent = node.parent.$elem
    
    style =
      color: $edge.css 'color'
      width: parseInt $edge.css 'line-height'
    style.offset = style.width / 2
    
    node_end     = $node.position()[@options.child_offset] + $node[@options.breadth]() / 2
    parent_end   = $parent.position()[@options.child_offset] + $parent[@options.breadth]() / 2
    edge_offset  = Math.min(node_end, parent_end) - style.offset
    edge_breadth = Math.abs(node_end - parent_end) + style.width
    
    $edge.attr @options.breadth, edge_breadth
    $edge.attr @options.height, @options.level_spacing
    $edge.css @options.child_offset, edge_offset - $node.position()[@options.child_offset]
    $edge.css @options.level_offset, -@options.level_spacing
    
    context = $edge.get(0).getContext '2d'
    context.strokeStyle = style.color
    context.lineWidth   = style.width
    context.clearRect 0, 0, $edge.width(), $edge.height()
    context.beginPath()
    
    x       = {}
    x.start = style.offset
    x.end   = edge_breadth - style.offset
    [x.start, x.end] = [x.end, x.start] if node_end < parent_end
    x.cp1   = x.start
    x.cp2   = x.end
    
    y = {}
    y.start = 0
    y.cp1   = @options.edge_curvature * @options.level_spacing
    y.cp2   = @options.level_spacing - y.cp1
    y.end   = @options.level_spacing
    if @options.level_offset is 'bottom' or @options.level_offset is 'right'
      [y.start, y.cp1, y.cp2, y.end] = [y.end, y.cp2, y.cp1, y.start]
    
    [x, y] = [y, x] if @options.breadth is 'height'
    
    context.moveTo x.start, y.start
    context.bezierCurveTo x.cp1, y.cp1, x.cp2, y.cp2, x.end, y.end
    context.stroke()
  
  ###
  Computes the child offset for the given node.
  
  The child offset is given by:
    The sum of the breadths of all previous subtrees, if the node is a leaf.
    Vertically aligning the node with its children, otherwise.
  ###
  get_child_offset: (node) ->
    @use_cache 'child_offset', node, =>
      # Start by computing the sum of previous subtree breadths
      offset = 0
      for subtree in node.previous_subtrees()
        offset += @get_subtree_breadth(subtree) + @options.child_spacing
      return offset unless node.children.length
      
      # Non-leaf nodes additionally need to be centered
      breadth  = @options.child_spacing * (node.children.length - 1)
      breadth += @get_subtree_breadth subtree for subtree in node.children
      offset  += (breadth - node.$elem[@options.breadth]()) / 2
  
  ###
  Computes the level offset for the given node.
  
  The level offset is given by:
    0, if the node is the root of the tree.
    
    The offset of the previous level plus the previous level's height,
    otherwise.
  ###
  get_level_offset: (node) ->
    @use_cache 'level_offset', node, =>
      return 0 if node == @root
      @get_level_offset(node.parent) + @get_level_height(node.parent) + @options.level_spacing
  
  ###
  Computes the breadth of a subtree.
  
  The breadth of a subtree is given by:
    The maximum of the breadth of the node, or the sum of the breadths of its
    children.
  ###
  get_subtree_breadth: (node) ->
    @use_cache 'subtree_breadth', node, =>
      return node.$elem[@options.breadth]() unless node.children.length
      
      breadth = @options.child_spacing * (node.children.length - 1)
      breadth += @get_subtree_breadth child for child in node.children
      Math.max node.$elem[@options.breadth](), breadth
  
  ###
  Computes the height of the level of the given node.
  
  The height of a level is given by:
    The maximum of the heights of all nodes in the level.
  ###
  get_level_height: (node) ->
    @use_cache 'level_height', node, =>
      options  = @options
      $heights = @$wrapper.find("[data-depth=#{node.depth}]").map ->
        $(@)[options.height]()
      Math.max.apply Math, $heights.get()
  
  ###
  Clears the cache.
  ###
  clear_cache: ->
    @caches = $.extend true, {}, @constructor.caches
  
  ###
  Gets a value from the cache, if it exists.
  ###
  get_cached: (name, node) ->
    @caches[name].values[@caches[name].keys.indexOf node]
  
  ###
  Sets a value in the cache.
  ###
  set_cached: (name, node, value) ->
    @caches[name].keys.push node
    @caches[name].values.push value
    return value
  
  ###
  Returns a value in the cache if one is found, otherwise the value is computed
  and cached.
  ###
  use_cache: (name, node, compute) ->
    return cached if cached = @get_cached name, node
    @set_cached name, node, compute()
  
  ###
  Adds a callback for an event.
  ###
  bind: (event, callback) ->
    @callbacks[event].push callback
    return callback
  
  ###
  Removes a callback from an event.
  ###
  unbind: (event, callback) ->
    if callback
      @callbacks[event].splice @callbacks[event].indexOf(callback), 1
    else
      @callbacks[event].splice 0, @callbacks[event].length
  
  ###
  Adds a callback for an event, which executes the given callback then removes
  itself from the callback list so it can only be triggered once.
  ###
  bind_once: (event, callback) ->
    new_callback = (args...) =>
      @unbind event, new_callback
      callback.apply @, args
    @bind event, new_callback
  
  ###
  Executes the callbacks for an event with given arguments.
  ###
  trigger: (event, args...) ->
    for callback in @callbacks[event]
      return false if callback.apply(@, args) is false
    return null