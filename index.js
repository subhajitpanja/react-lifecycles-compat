/**
 * Copyright (c) 2013-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

'use strict';

// Older versions of React do not support static getDerivedStateFromProps.
// As a workaround, use cWM and cWRP to invoke the new static lifecycle.
// Newer versions of React will ignore these methods if gDSFP exists.
function componentWillMount() {
  // Call this.constructor.gDSFP to support sub-classes.
  var state = this.constructor.getDerivedStateFromProps(this.props, this.state);
  if (state !== null && state !== undefined) {
    this.setState(state);
  }
}

function componentWillReceiveProps(nextProps) {
  // Call this.constructor.gDSFP to support sub-classes.
  var state = this.constructor.getDerivedStateFromProps(nextProps, this.state);
  if (state !== null && state !== undefined) {
    this.setState(state);
  }
}

function componentWillUpdate(nextProps, nextState) {
  var prevProps = this.props;
  var prevState = this.state;
  this.props = nextProps;
  this.state = nextState;
  try {
    this.__reactInternalSnapshot = this.getSnapshotBeforeUpdate(
      prevProps,
      prevState
    );
  } finally {
    this.props = prevProps;
    this.state = prevState;
  }
}

// React may warn about cWM/cWRP/cWU methods being deprecated.
// Add a flag to suppress these warnings for this special case.
componentWillMount.__suppressDeprecationWarning = true;
componentWillReceiveProps.__suppressDeprecationWarning = true;
componentWillUpdate.__suppressDeprecationWarning = true;

module.exports = function polyfill(Component) {
  if (!Component.prototype || !Component.prototype.isReactComponent) {
    throw new Error('Can only polyfill class components');
  }

  if (typeof Component.getDerivedStateFromProps === 'function') {
    if (typeof Component.prototype.componentWillMount === 'function') {
      throw new Error('Cannot polyfill if componentWillMount already exists');
    } else if (
      typeof Component.prototype.componentWillReceiveProps === 'function'
    ) {
      throw new Error(
        'Cannot polyfill if componentWillReceiveProps already exists'
      );
    }

    Component.prototype.componentWillMount = componentWillMount;
    Component.prototype.componentWillReceiveProps = componentWillReceiveProps;
  }

  if (typeof Component.prototype.getSnapshotBeforeUpdate === 'function') {
    if (typeof Component.prototype.componentWillUpdate === 'function') {
      throw new Error('Cannot polyfill if componentWillUpdate already exists');
    }

    if (typeof Component.prototype.componentDidUpdate !== 'function') {
      throw new Error(
        'Cannot polyfill getSnapshotBeforeUpdate() unless componentDidUpdate() exists on the prototype'
      );
    }

    Component.prototype.componentWillUpdate = componentWillUpdate;

    var componentDidUpdate = Component.prototype.componentDidUpdate;

    Component.prototype.componentDidUpdate = function componentDidUpdatePolyfill(
      prevProps,
      prevState
    ) {
      componentDidUpdate.call(
        this,
        prevProps,
        prevState,
        this.__reactInternalSnapshot
      );
    };
  }

  return Component;
};
