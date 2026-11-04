/// <reference path="../pb_data/types.d.ts" />

// Generate the first occurrences as soon as a recurring series is created,
// so it's immediately usable instead of waiting for the next cron tick.

onRecordAfterCreateSuccess((e) => {
  const shared = require(`${__hooks}/shared.js`);
  shared.ensureOccurrencesForSeries(e.app, e.record);
  e.next();
}, "event_series");
