/**
 * Licensed to the Apache Software Foundation (ASF) under one
 * or more contributor license agreements.  See the NOTICE file
 * distributed with this work for additional information
 * regarding copyright ownership.  The ASF licenses this file
 * to you under the Apache License, Version 2.0 (the
 * "License"); you may not use this file except in compliance
 * with the License.  You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var App = require('app');

function _getLabelPathWithoutApp(labelBindingPath) {
  return labelBindingPath.startsWith('App.') ? labelBindingPath.replace('App.', '') : labelBindingPath;
}

/**
 * Don't create instances directly
 * Only <code>App.BreadcrumbsView</code>-instance will create them
 *
 * @type {Em.Object}
 */
App.BreadcrumbItem = Em.Object.extend({

  /**
   * String shown as breadcrumb
   *
   * @type {string}
   */
  label: '',

  /**
   * Path to variable that will be used as breadcrumb
   * If <code>labelBindingPath</code> is <code>'App.router.somePath'</code>, its value will be used
   *
   * @type {string}
   */
  labelBindingPath: '',

  /**
   * Determines if breadcrumb is disabled
   *
   * @type {boolean}
   */
  disabled: false,

  /**
   * Check if current breadcrumb is last
   *
   * @type {boolean}
   */
  isLast: false,

  /**
   * Move user to this route when click on breadcrumb item (don't add prefix <code>main</code>)
   *
   * @type {string}
   */
  route: '',

  /**
   * Hook executed before transition
   * may be overridden when needed
   *
   * @type {Function}
   */
  beforeTransition: Em.K,

  /**
   * Hook executed after transition
   * may be overridden when needed
   *
   * @type {Function}
   */
  afterTransition: Em.K,

  /**
   * Label shown on the page
   * Result of <code>createLabel</code> execution
   *
   * @type {string}
   */
  formattedLabel: '',

  /**
   * Hook for label formatting
   * It's executed after <code>label</code> or <code>labelBindingPath</code> is processed
   *
   * @param {string} label
   * @returns {string}
   */
  labelPostFormat: function (label) {
    return label;
  },

  transition: function () {
    return App.router.route('main/' + this.get('route'));
  },

  /**
   * Generate <code>formattedLabel</code> shown on the page
   *
   * @method createLabel
   */
  createLabel() {
    let label = this.get('label');
    let labelBindingPath = this.get('labelBindingPath');

    let formattedLabel = labelBindingPath ? App.get(_getLabelPathWithoutApp(labelBindingPath)) : label;
    this.set('formattedLabel', this.labelPostFormat(formattedLabel));
  },

  /**
   * If <code>labelBindingPath</code> is provided, <code>createLabel</code> should observe value in path <code>${labelBindingPath}</code>
   *
   * @returns {*}
   */
  init() {
    let labelBindingPath = this.get('labelBindingPath');
    if (labelBindingPath) {
      labelBindingPath = `App.${_getLabelPathWithoutApp(labelBindingPath)}`;
      this.addObserver(labelBindingPath, this, 'createLabel');
    }
    this.createLabel();
    return this._super(...arguments);
  }

});

/**
 * Usage:
 * <code>{{view App.BreadcrumbsView}}</code>
 *
 * @type {Em.View}
 */
App.BreadcrumbsView = Em.View.extend({

  templateName: require('templates/common/breadcrumbs'),

  /**
   * List of the breadcrumbs
   * It's updated if <code>App.router.currentState</code> is changed. This happens when user is moved from one page to another
   *
   * @type {BreadcrumbItem[]}
   */
  items: function () {
    let currentState = App.get('router.currentState');
    let items = [];
    while (currentState) {
      if (currentState.breadcrumbs) {
        items.pushObject(currentState.breadcrumbs);
      }
      currentState = currentState.get('parentState');
    }
    items = items.reverse().map(item => App.BreadcrumbItem.extend(item).create());
    if (items.length) {
      items.get('lastObject').setProperties({
        disabled: true,
        isLast: true
      });
    }
    return items;
  }.property('App.router.currentState'),

  /**
   * Move user to the route described in the breadcrumb item
   * <code>beforeTransition</code> hook is executed
   *
   * @param {{context: App.BreadcrumbItem}} event
   * @returns {*}
   */
  moveTo(event) {
    let item = event.context;
    if (!item || item.get('disabled')) {
      return;
    }
    Em.tryInvoke(item, 'beforeTransition');
    Em.tryInvoke(item, 'transition');
    Em.tryInvoke(item, 'afterTransition');
  }

});