"use strict";

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// constants

var UPDATE_PATH = "@@router/UPDATE_PATH";
var SELECT_STATE = function SELECT_STATE(state) {
  return state.routing;
};

// Action creator

function updatePath(path, noRouterUpdate) {
  return {
    type: UPDATE_PATH,
    path: path,
    noRouterUpdate: noRouterUpdate
  };
}

// Reducer

var initialState = typeof window === 'undefined' ? {} : {
  path: locationToString(window.location)
};

function update() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
  var action = arguments[1];

  if (action.type === UPDATE_PATH) {
    return _extends({}, state, {
      path: action.path,
      noRouterUpdate: action.noRouterUpdate
    });
  }
  return state;
}

// Syncing

function locationToString(location) {
  return location.pathname + location.search + location.hash;
}

function syncReduxAndRouter(history, store) {
  var selectRouterState = arguments.length <= 2 || arguments[2] === undefined ? SELECT_STATE : arguments[2];

  var getRouterState = function getRouterState() {
    return selectRouterState(store.getState());
  };

  if (!getRouterState()) {
    throw new Error("Cannot sync router: route state does not exist. Did you " + "install the routing reducer?");
  }

  var unsubscribeHistory = history.listen(function (location) {
    // Avoid dispatching an action if the store is already up-to-date,
    // even if `history` wouldn't do anything if the location is the same
    if (getRouterState().path !== locationToString(location)) {
      store.dispatch(updatePath(locationToString(location)));
    }
  });

  var unsubscribeStore = store.subscribe(function () {
    var routing = getRouterState();

    // Don't update the router if nothing has changed. The
    // `noRouterUpdate` flag can be set to avoid updating altogether,
    // which is useful for things like loading snapshots or very special
    // edge cases.
    if (routing.path !== locationToString(window.location) && !routing.noRouterUpdate) {
      history.pushState(null, routing.path);
    }
  });

  return function unsubscribe() {
    unsubscribeHistory();
    unsubscribeStore();
  };
}

module.exports = {
  UPDATE_PATH: UPDATE_PATH,
  updatePath: updatePath,
  syncReduxAndRouter: syncReduxAndRouter,
  routeReducer: update
};
