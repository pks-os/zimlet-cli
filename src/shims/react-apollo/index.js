/** This file is an auto-generated shim, aliased in for "react-apollo" in the webpack config.
*  When components import 'react-apollo', we want to give them back the copy
*  Zimbra passed down when it called the factory provided to zimlet().
*/

/* eslint-disable camelcase, dot-notation */
import { warnOnMissingExport } from '../';
const wrap = warnOnMissingExport.bind(null, global.shims['react-apollo'], 'react-apollo');

export const ApolloConsumer = wrap('ApolloConsumer');
export const ApolloContext = wrap('ApolloContext');
export const ApolloProvider = wrap('ApolloProvider');
export const Mutation = wrap('Mutation');
export const Query = wrap('Query');
export const RenderPromises = wrap('RenderPromises');
export const Subscription = wrap('Subscription');
export const compose = wrap('compose');
export const getDataFromTree = wrap('getDataFromTree');
export const getMarkupFromTree = wrap('getMarkupFromTree');
export const graphql = wrap('graphql');
export const renderToStringWithData = wrap('renderToStringWithData');
export const withApollo = wrap('withApollo');
export const withMutation = wrap('withMutation');
export const withQuery = wrap('withQuery');
export const withSubscription = wrap('withSubscription');
export default global.shims['react-apollo'];
