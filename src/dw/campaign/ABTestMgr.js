'use strict';
const ArrayList = require('../util/ArrayList');
module.exports = { isParticipant(testID, segmentID) { const rt = require('../../runtime').current(); const t = rt.store.get('ab-tests', {})[testID]; return !!(t && t.activeSegment === segmentID); }, getAssignedTestSegments() { return new ArrayList(); } };
