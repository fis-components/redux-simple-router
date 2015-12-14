'use strict';

var _extends = Object.assign || function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; };

// constants

var UPDATE_PATH = "@@router/UPDATE_PATH";
var SELECT_STATE = function SELECT_STATE(state) {
  return state.routing;
};

// Action creator

function updatePath(path, avoidRouterUpdate) {
  return {
    type: UPDATE_PATH,
    path: path,
    avoidRouterUpdate: !!avoidRouterUpdate
  };
}

// Reducer

var initialState = {
  changeId: 1,
  path: typeof window !== 'undefined' ? locationToString(window.location) : '/'
};

function update() {
  var state = arguments.length <= 0 || arguments[0] === undefined ? initialState : arguments[0];
  var action = arguments[1];

  if (action.type === UPDATE_PATH) {
    return _extends({}, state, {
      path: action.path,
      changeId: state.changeId + (action.avoidRouterUpdate ? 0 : 1)
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
  var lastChangeId = 0;

  if (!getRouterState()) {
    throw new Error("Cannot sync router: route state does not exist. Did you " + "install the routing reducer?");
  }

  var unsubscribeHistory = history.listen(function (location) {
    var routePath = locationToString(location);

    // Avoid dispatching an action if the store is already up-to-date
    if (getRouterState().path !== routePath) {
      store.dispatch(updatePath(routePath, { avoidRouterUpdate: true }));
    }
  });

  var unsubscribeStore = store.subscribe(function () {
    var routing = getRouterState();

    // Only update the router once per `updatePath` call. This is
    // indicated by the `changeId` state; when that number changes, we
    // should call `pushState`.
    if (lastChangeId !== routing.changeId) {
      lastChangeId = routing.changeId;
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
