/** This file is an auto-generated shim, aliased in for "@zimbra-client/util" in the webpack config.
*  When components import '@zimbra-client/util', we want to give them back the copy
*  Zimbra passed down when it called the factory provided to zimlet().
*/

/* eslint-disable camelcase, dot-notation */
import { warnOnMissingExport } from '../../';
const wrap = warnOnMissingExport.bind(null, global.shims['@zimbra-client/util'], '@zimbra-client/util');

export const array = wrap('array');
export const getDataTransferJSON = wrap('getDataTransferJSON');
export const setDataTransferJSON = wrap('setDataTransferJSON');
export const breakpoints = wrap('breakpoints');
export const callWith = wrap('callWith');
export const pruneEmpty = wrap('pruneEmpty');
export default global.shims['@zimbra-client/util'];
