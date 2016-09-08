(function() {
    var root = this, modules, require_from, register, error;
    if (typeof global == "undefined") {
        var global = typeof window === "undefined" ? root : window;
    }
    modules = {};
    require_from = function(parent, from) {
        return function(name) {
            if (modules[from] && modules[from][name]) {
                modules[from][name].parent = parent;
                if (modules[from][name].initialize) {
                    modules[from][name].initialize();
                }
                return modules[from][name].exports;
            } else {
                return error(name, from);
            }
        };
    };
    register = function(names, directory, callback) {
        var module = {
            exports: {},
            initialize: function() {
                callback.call(module.exports, global, module, module.exports, require_from(module, directory), undefined);
                delete module.initialize;
            },
            parent: null
        };
        for (var from in names) {
            modules[from] = modules[from] || {};
            for (var j in names[from]) {
                var name = names[from][j];
                modules[from][name] = module;
            }
        }
    };
    error = function anonymous(name, from) {
        var message = "Warn: could not find module " + name;
        message += " from " + from;
        console.log(message);
    };
    register({
        src: [ "./node" ]
    }, "src", function(global, module, exports, require, window) {
        (function() {
            var Node;
            module.exports = Node = function() {
                function Node(label) {
                    this.depth = 0;
                    this.tree = null;
                    this.parent = null;
                    this.children = [];
                    this.$elem = $("<li/>").addClass("node").attr("data-depth", this.depth).data("node", this);
                    this.$edge = $("<canvas/>").addClass("edge").attr({
                        width: 0,
                        height: 0
                    }).appendTo(this.$elem);
                    this.$label = $("<span/>").addClass("label").appendTo(this.$elem);
                    this.$label.text(label);
                }
                Node.prototype.insert_child = function(node, index) {
                    if (index == null) {
                        index = this.children.length;
                    }
                    node.depth = this.depth + 1;
                    node.tree = this.tree;
                    node.parent = this;
                    node.$elem.attr("data-depth", node.depth);
                    return [].splice.apply(this.children, [ index, index - index ].concat(node)), node;
                };
                Node.prototype.remove_child = function(node) {
                    node.depth = 0;
                    node.tree = null;
                    node.parent = null;
                    node.$elem.attr("node-depth", 0);
                    return this.children.splice(this.children.indexOf(node), 1);
                };
                Node.prototype.index = function() {
                    var ref;
                    return (ref = this.parent) != null ? ref.children.indexOf(this) : void 0;
                };
                Node.prototype.parents = function() {
                    var parent, results;
                    results = [];
                    while (parent = (parent != null ? parent : this).parent) {
                        results.push(parent);
                    }
                    return results;
                };
                Node.prototype.subtree_nodes = function() {
                    var child, i, len, nodes, ref;
                    nodes = [ this ];
                    ref = this.children;
                    for (i = 0, len = ref.length; i < len; i++) {
                        child = ref[i];
                        nodes = nodes.concat(child.subtree_nodes());
                    }
                    return nodes;
                };
                Node.prototype.siblings = function() {
                    if (!this.parent) {
                        return [];
                    }
                    return this.parent.children.slice(0, this.index()).concat(this.parent.children.slice(this.index() + 1));
                };
                Node.prototype.previous_sibling = function() {
                    var ref;
                    return (ref = this.parent) != null ? ref.children[this.index() - 1] : void 0;
                };
                Node.prototype.previous_siblings = function() {
                    var ref, ref1;
                    return (ref = (ref1 = this.parent) != null ? ref1.children.slice(0, this.index()) : void 0) != null ? ref : [];
                };
                Node.prototype.previous_subtrees = function() {
                    var ref, ref1;
                    return this.previous_siblings().concat((ref = (ref1 = this.parent) != null ? ref1.previous_subtrees() : void 0) != null ? ref : []);
                };
                Node.prototype.next_sibling = function() {
                    var ref;
                    return (ref = this.parent) != null ? ref.children[this.index() + 1] : void 0;
                };
                Node.prototype.next_siblings = function() {
                    var ref, ref1;
                    return (ref = (ref1 = this.parent) != null ? ref1.children.slice(index() + 1) : void 0) != null ? ref : [];
                };
                Node.prototype.next_subtrees = function() {
                    var ref, ref1;
                    return this.next_siblings().concat((ref = (ref1 = this.parent) != null ? ref1.next_subtrees() : void 0) != null ? ref : []);
                };
                Node.prototype.toJSON = function() {
                    return this.$label.text();
                };
                return Node;
            }();
        }).call(this);
    });
    register({
        "": [ "Tree" ]
    }, "src", function(global, module, exports, require, window) {
        (function() {
            var Node, Tree, indexOf = [].indexOf || function(item) {
                for (var i = 0, l = this.length; i < l; i++) {
                    if (i in this && this[i] === item) return i;
                }
                return -1;
            }, slice = [].slice;
            Node = require("./node");
            module.exports = Tree = function() {
                var get_empty_cache;
                Tree.Node = Node;
                Tree.options = {
                    child_offset: "top",
                    level_offset: "right",
                    breadth: "height",
                    height: "width",
                    child_spacing: 5,
                    level_spacing: 50,
                    edge_curvature: .5
                };
                Tree.callbacks = {
                    "anim:after": [],
                    "node:add": [],
                    "node:click": [],
                    "node:remove": []
                };
                get_empty_cache = function() {
                    return {
                        keys: [],
                        values: []
                    };
                };
                Tree.caches = {
                    child_offset: get_empty_cache(),
                    level_offset: get_empty_cache(),
                    subtree_breadth: get_empty_cache(),
                    level_height: get_empty_cache()
                };
                function Tree($container, options) {
                    this.$container = $container;
                    if (options == null) {
                        options = {};
                    }
                    this.options = $.extend(true, {}, this.constructor.options, options);
                    this.callbacks = $.extend(true, {}, this.constructor.callbacks);
                    this.root = null;
                    this.centre = null;
                    this.clear_cache();
                    this.insertions = [];
                    this.removals = [];
                    this.previous_styles = "{}";
                    this.$container = $(this.$container).addClass("tree");
                    this.$wrapper = $("<ul/>").addClass("wrapper").appendTo(this.$container);
                    this.$container.bind("click.tree", function(_this) {
                        return function(event) {
                            var node;
                            if (node = $(event.target).closest(".label").parent().data("node")) {
                                return _this.trigger("node:click", node);
                            }
                        };
                    }(this));
                }
                Tree.prototype.set_root = function(node) {
                    var child, i, len, old_root, ref, ref1;
                    if (typeof node !== "object") {
                        node = new Node(node);
                    }
                    this.$wrapper.find("*").remove();
                    this.insertions = this.insertions.concat([ node ]);
                    ref = node.subtree_nodes();
                    for (i = 0, len = ref.length; i < len; i++) {
                        child = ref[i];
                        child.tree = this;
                    }
                    ref1 = [ this.root, node ], old_root = ref1[0], this.root = ref1[1];
                    return old_root;
                };
                Tree.prototype.set_centre = function(node) {
                    return this.centre = node;
                };
                Tree.prototype.insert_node = function(node, context, index) {
                    if (index == null) {
                        index = null;
                    }
                    if (typeof node !== "object") {
                        node = new Node(node);
                    }
                    this.insertions = this.insertions.concat(node.subtree_nodes());
                    return context.insert_child(node, index);
                };
                Tree.prototype.remove_node = function(node) {
                    if (this.trigger("node:remove", node) === false) {
                        return false;
                    }
                    this.removals = this.removals.concat(node.subtree_nodes());
                    return node.parent.remove_child(node);
                };
                Tree.prototype.refresh = function() {
                    var elem, i, j, len, len1, node, ref, ref1, ref2, styles;
                    ref = this.removals;
                    for (i = 0, len = ref.length; i < len; i++) {
                        node = ref[i];
                        node.$elem.remove();
                    }
                    styles = this.layout();
                    this.$wrapper.css(styles.wrapper);
                    ref1 = styles.nodes;
                    for (j = 0, len1 = ref1.length; j < len1; j++) {
                        ref2 = ref1[j], node = ref2.node, elem = ref2.elem;
                        node.$elem.css(elem);
                        node.$elem.fadeTo(0, 1);
                        this.draw_edge(node);
                    }
                    this.insertions = [];
                    this.removals = [];
                    this.previous_styles = JSON.stringify(styles);
                    return this;
                };
                Tree.prototype.animate = function() {
                    async.forEach(this.removals, function(node, done) {
                        return node.$elem.fadeTo(500, 0, function() {
                            $(this).remove();
                            return done();
                        });
                    }, function(_this) {
                        return function() {
                            var json_styles, styles;
                            styles = _this.layout();
                            json_styles = JSON.stringify(styles);
                            if (json_styles === _this.previous_styles) {
                                return _this.trigger("anim:after");
                            }
                            return async.parallel([ function(done) {
                                return _this.$wrapper.animate(styles.wrapper, {
                                    complete: done
                                });
                            }, function(done) {
                                return async.forEach(styles.nodes, function(arg, done) {
                                    var elem, node;
                                    node = arg.node, elem = arg.elem;
                                    return node.$elem.animate(elem, {
                                        complete: function() {
                                            return node.$elem.fadeTo(500, 1, done);
                                        },
                                        step: function() {
                                            return _this.draw_edge(node);
                                        }
                                    });
                                }, done);
                            } ], function() {
                                _this.insertions = [];
                                _this.removals = [];
                                _this.previous_styles = json_styles;
                                return _this.trigger("anim:after");
                            });
                        };
                    }(this));
                    return this;
                };
                Tree.prototype.layout = function() {
                    var css, i, j, len, len1, node, ref, ref1, styles;
                    ref = this.insertions;
                    for (i = 0, len = ref.length; i < len; i++) {
                        node = ref[i];
                        this.$wrapper.append(node.$elem.fadeTo(0, 0));
                        this.trigger("node:add", node);
                    }
                    this.clear_cache();
                    styles = {
                        wrapper: {},
                        nodes: []
                    };
                    ref1 = this.root.subtree_nodes();
                    for (j = 0, len1 = ref1.length; j < len1; j++) {
                        node = ref1[j];
                        css = {
                            node: node,
                            elem: {},
                            edge: {}
                        };
                        css.elem[this.options.child_offset] = this.get_child_offset(node);
                        css.elem[this.options.level_offset] = this.get_level_offset(node);
                        css.edge[this.options.child_offset] = -css.elem[this.options.child_offset];
                        css.edge[this.options.level_offset] = -this.options.level_spacing;
                        styles.nodes.push(css);
                        if (this.centre === node) {
                            styles.wrapper[this.options.child_offset] = (this.$container[this.options.breadth]() - node.$elem[this.options.breadth]()) / 2 - css.elem[this.options.child_offset];
                            styles.wrapper[this.options.level_offset] = (this.$container[this.options.height]() - node.$elem[this.options.height]()) / 2 - css.elem[this.options.level_offset];
                        }
                    }
                    return styles;
                };
                Tree.prototype.draw_edge = function(node) {
                    var $edge, $node, $parent, context, edge_breadth, edge_offset, node_end, parent_end, ref, ref1, ref2, style, x, y;
                    if (!node.parent) {
                        return;
                    }
                    $node = node.$elem;
                    $edge = node.$edge;
                    $parent = node.parent.$elem;
                    style = {
                        color: $edge.css("color"),
                        width: parseInt($edge.css("line-height"))
                    };
                    style.offset = style.width / 2;
                    node_end = $node.position()[this.options.child_offset] + $node[this.options.breadth]() / 2;
                    parent_end = $parent.position()[this.options.child_offset] + $parent[this.options.breadth]() / 2;
                    edge_offset = Math.min(node_end, parent_end) - style.offset;
                    edge_breadth = Math.abs(node_end - parent_end) + style.width;
                    $edge.attr(this.options.breadth, edge_breadth);
                    $edge.attr(this.options.height, this.options.level_spacing);
                    $edge.css(this.options.child_offset, edge_offset - $node.position()[this.options.child_offset]);
                    $edge.css(this.options.level_offset, -this.options.level_spacing);
                    context = $edge.get(0).getContext("2d");
                    context.strokeStyle = style.color;
                    context.lineWidth = style.width;
                    context.clearRect(0, 0, $edge.width(), $edge.height());
                    context.beginPath();
                    x = {};
                    x.start = style.offset;
                    x.end = edge_breadth - style.offset;
                    if (node_end < parent_end) {
                        ref = [ x.end, x.start ], x.start = ref[0], x.end = ref[1];
                    }
                    x.cp1 = x.start;
                    x.cp2 = x.end;
                    y = {};
                    y.start = 0;
                    y.cp1 = this.options.edge_curvature * this.options.level_spacing;
                    y.cp2 = this.options.level_spacing - y.cp1;
                    y.end = this.options.level_spacing;
                    if (this.options.level_offset === "bottom" || this.options.level_offset === "right") {
                        ref1 = [ y.end, y.cp2, y.cp1, y.start ], y.start = ref1[0], y.cp1 = ref1[1], y.cp2 = ref1[2], y.end = ref1[3];
                    }
                    if (this.options.breadth === "height") {
                        ref2 = [ y, x ], x = ref2[0], y = ref2[1];
                    }
                    context.moveTo(x.start, y.start);
                    context.bezierCurveTo(x.cp1, y.cp1, x.cp2, y.cp2, x.end, y.end);
                    return context.stroke();
                };
                Tree.prototype.get_child_offset = function(node) {
                    return this.use_cache("child_offset", node, function(_this) {
                        return function() {
                            var breadth, i, j, len, len1, offset, ref, ref1, subtree;
                            offset = 0;
                            ref = node.previous_subtrees();
                            for (i = 0, len = ref.length; i < len; i++) {
                                subtree = ref[i];
                                offset += _this.get_subtree_breadth(subtree) + _this.options.child_spacing;
                            }
                            if (!node.children.length) {
                                if (!node.previous_sibling()) {
                                    offset += 10;
                                }
                                return offset;
                            }
                            breadth = _this.options.child_spacing * (node.children.length - 1);
                            ref1 = node.children;
                            for (j = 0, len1 = ref1.length; j < len1; j++) {
                                subtree = ref1[j];
                                breadth += _this.get_subtree_breadth(subtree);
                            }
                            return offset += (breadth - node.$elem[_this.options.breadth]()) / 2;
                        };
                    }(this));
                };
                Tree.prototype.get_level_offset = function(node) {
                    return this.use_cache("level_offset", node, function(_this) {
                        return function() {
                            if (node === _this.root) {
                                return 0;
                            }
                            return _this.get_level_offset(node.parent) + _this.get_level_height(node.parent) + _this.options.level_spacing;
                        };
                    }(this));
                };
                Tree.prototype.get_subtree_breadth = function(node) {
                    return this.use_cache("subtree_breadth", node, function(_this) {
                        return function() {
                            var breadth, child, i, len, ref;
                            if (!node.children.length) {
                                breadth = node.$elem[_this.options.breadth]();
                                if (!node.previous_sibling()) {
                                    breadth += 10;
                                }
                                if (!node.next_sibling()) {
                                    breadth += 10;
                                }
                                return breadth;
                            }
                            breadth = _this.options.child_spacing * (node.children.length - 1);
                            ref = node.children;
                            for (i = 0, len = ref.length; i < len; i++) {
                                child = ref[i];
                                breadth += _this.get_subtree_breadth(child);
                            }
                            return Math.max(node.$elem[_this.options.breadth](), breadth);
                        };
                    }(this));
                };
                Tree.prototype.get_level_height = function(node) {
                    return this.use_cache("level_height", node, function(_this) {
                        return function() {
                            var $heights, options;
                            options = _this.options;
                            $heights = _this.$wrapper.find("[data-depth=" + node.depth + "]").map(function() {
                                return $(this)[options.height]();
                            });
                            return Math.max.apply(Math, $heights.get());
                        };
                    }(this));
                };
                Tree.prototype.clear_cache = function() {
                    return this.caches = $.extend(true, {}, this.constructor.caches);
                };
                Tree.prototype.get_cached = function(name, node) {
                    return this.caches[name].values[this.caches[name].keys.indexOf(node)];
                };
                Tree.prototype.set_cached = function(name, node, value) {
                    this.caches[name].keys.push(node);
                    this.caches[name].values.push(value);
                    return value;
                };
                Tree.prototype.use_cache = function(name, node, compute) {
                    var cached;
                    if (cached = this.get_cached(name, node)) {
                        return cached;
                    }
                    return this.set_cached(name, node, compute());
                };
                Tree.prototype.bind = function(event, callback) {
                    this.callbacks[event].push(callback);
                    return callback;
                };
                Tree.prototype.unbind = function(event, callback) {
                    if (callback && indexOf.call(this.callbacks[event], callback) >= 0) {
                        return this.callbacks[event].splice(this.callbacks[event].indexOf(callback), 1);
                    } else {
                        return this.callbacks[event].splice(0, this.callbacks[event].length);
                    }
                };
                Tree.prototype.bind_once = function(event, callback) {
                    var new_callback;
                    new_callback = function(_this) {
                        return function() {
                            var args;
                            args = 1 <= arguments.length ? slice.call(arguments, 0) : [];
                            _this.unbind(event, new_callback);
                            return callback.apply(_this, args);
                        };
                    }(this);
                    return this.bind(event, new_callback);
                };
                Tree.prototype.trigger = function() {
                    var args, callback, event, i, len, ref;
                    event = arguments[0], args = 2 <= arguments.length ? slice.call(arguments, 1) : [];
                    ref = this.callbacks[event];
                    for (i = 0, len = ref.length; i < len; i++) {
                        callback = ref[i];
                        if (callback.apply(this, args) === false) {
                            return false;
                        }
                    }
                    return null;
                };
                return Tree;
            }();
        }).call(this);
    });
    root["Tree"] = require_from(null, "")("Tree");
}).call(this);