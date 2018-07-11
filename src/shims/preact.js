/** This file is a shim, aliased in for "preact" in the webpack config.
 *  When components import 'preact', we want to give them back the copy
 *  Zimbra passed down when it called the factory provided to zimlet().
 */

const { h, createElement, cloneElement, Component } = global.shims.preact;

export { h, createElement, cloneElement, Component };
export default global.shims.preact;