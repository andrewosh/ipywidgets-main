// Copyright (c) Jupyter Development Team.
// Distributed under the terms of the Modified BSD License.

// npm compatibility
if (typeof define !== 'function') { var define = require('./requirejs-shim')(module); }

define([
    "nbextensions/widgets/widgets/js/widget",
    "jquery",
    "bootstrap",
], function(widget, $) {

    var HTMLView = widget.DOMWidgetView.extend({  
        render : function() {
            /**
             * Called when view is rendered.
             */
            this.$el
                .addClass('ipy-widget widget-html');
            this.update(); // Set defaults.
        },
        
        update : function() {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been 
             * changed by another view or by a state update from the back-end.
             */
            this.$el.html(this.model.get('value')); // CAUTION! .html(...) CALL MANDATORY!!!
            return HTMLView.__super__.update.apply(this);
        },
    });


    var LatexView = widget.DOMWidgetView.extend({  
        render : function() {
            /**
             * Called when view is rendered.
             */
            this.$el
                .addClass('ipy-widget widget-latex');
            this.update(); // Set defaults.
        },
        
        update : function() {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been 
             * changed by another view or by a state update from the back-end.
             */
            this.typeset(this.$el, this.model.get('value'));
            return LatexView.__super__.update.apply(this);
        }, 
    });


    var TextareaView = widget.DOMWidgetView.extend({  
        render: function() {
            /**
             * Called when view is rendered.
             */
            this.$el
                .addClass('ipy-widget widget-hbox widget-textarea');
            this.$label = $('<div />')
                .appendTo(this.$el)
                .addClass('widget-label')
                .hide();
            this.$textbox = $('<textarea />')
                .attr('rows', 5)
                .addClass('form-control')
                .appendTo(this.$el);
            this.update(); // Set defaults.

            this.listenTo(this.model, 'msg:custom', $.proxy(this._handle_textarea_msg, this));
            this.listenTo(this.model, 'change:placeholder', function(model, value, options) {
                this.update_placeholder(value);
            }, this);

            this.update_placeholder();
        },

        _handle_textarea_msg: function (content) {
            /**
             * Handle when a custom msg is recieved from the back-end.
             */
            if (content.method == "scroll_to_bottom") {
                this.scroll_to_bottom();                
            }
        },

        update_placeholder: function(value) {
            if (!value) {
                value = this.model.get('placeholder');
            }
            this.$textbox.attr('placeholder', value);
        },

        scroll_to_bottom: function () {
            /**
             * Scroll the text-area view to the bottom.
             */
            this.$textbox.scrollTop(this.$textbox[0].scrollHeight);
        },

        update: function(options) {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been 
             * changed by another view or by a state update from the back-end.
             */
            if (options === undefined || options.updated_view != this) {
                this.$textbox.val(this.model.get('value'));

                var disabled = this.model.get('disabled');
                this.$textbox.prop('disabled', disabled);

                var description = this.model.get('description');
                if (description.length === 0) {
                    this.$label.hide();
                } else {
                    this.typeset(this.$label, description);
                    this.$label.show();
                }
            }
            return TextareaView.__super__.update.apply(this);
        },

        events: {
            // Dictionary of events and their handlers.
            "keyup textarea" : "handleChanging",
            "paste textarea" : "handleChanging",
            "cut textarea"   : "handleChanging"
        },
        
        handleChanging: function(e) { 
            /**
             * Handles and validates user input.
             *
             * Calling model.set will trigger all of the other views of the 
             * model to update.
             */
            this.model.set('value', e.target.value, {updated_view: this});
            this.touch();
        },
    });


    var TextView = widget.DOMWidgetView.extend({  
        render: function() {
            /**
             * Called when view is rendered.
             */
            this.$el
                .addClass('ipy-widget widget-hbox widget-text');
            this.$label = $('<div />')
                .addClass('widget-label')
                .appendTo(this.$el)
                .hide();
            this.$textbox = $('<input type="text" />')
                .addClass('input')
                .addClass('form-control')
                .appendTo(this.$el);
            this.update(); // Set defaults.
            this.listenTo(this.model, 'change:placeholder', function(model, value, options) {
                this.update_placeholder(value);
            }, this);

            this.update_placeholder();
        },

        update_placeholder: function(value) {
            if (!value) {
                value = this.model.get('placeholder');
            }
            this.$textbox.attr('placeholder', value);
        },
        
        update: function(options) {
            /**
             * Update the contents of this view
             *
             * Called when the model is changed.  The model may have been 
             * changed by another view or by a state update from the back-end.
             */
            if (options === undefined || options.updated_view != this) {
                if (this.$textbox.val() != this.model.get('value')) {
                    this.$textbox.val(this.model.get('value'));
                }

                var disabled = this.model.get('disabled');
                this.$textbox.prop('disabled', disabled);

                var description = this.model.get('description');
                if (description.length === 0) {
                    this.$label.hide();
                } else {
                    this.typeset(this.$label, description);
                    this.$label.show();
                }
            }
            return TextView.__super__.update.apply(this);
        },

        events: {
            // Dictionary of events and their handlers.
            "keyup input"    : "handleChanging",
            "paste input"    : "handleChanging",
            "cut input"      : "handleChanging",
            "keypress input" : "handleKeypress",
            "blur input" : "handleBlur",
            "focusout input" : "handleFocusOut"
        },
        
        handleChanging: function(e) { 
            /**
             * Handles user input.
             *
             * Calling model.set will trigger all of the other views of the 
             * model to update.
             */
            this.model.set('value', e.target.value, {updated_view: this});
            this.touch();
        },
        
        handleKeypress: function(e) { 
            /**
             * Handles text submition
             */
            if (e.keyCode == 13) { // Return key
                this.send({event: 'submit'});
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        },

        handleBlur: function(e) { 
            /**
             * Prevent a blur from firing if the blur was not user intended.
             * This is a workaround for the return-key focus loss bug.
             * TODO: Is the original bug actually a fault of the keyboard
             * manager?
             */
            if (e.relatedTarget === null) {
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        },

        handleFocusOut: function(e) { 
            /**
             * Prevent a blur from firing if the blur was not user intended.
             * This is a workaround for the return-key focus loss bug.
             */
            if (e.relatedTarget === null) {
                e.stopPropagation();
                e.preventDefault();
                return false;
            }
        },
    });

    return {
        'HTMLView': HTMLView,
        'LatexView': LatexView,
        'TextareaView': TextareaView,
        'TextView': TextView,
    };
});
