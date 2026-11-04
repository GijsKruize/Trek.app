/// <reference path="../pb_data/types.d.ts" />

// Tops up every active recurring series to a rolling 8-week occurrence
// horizon. Safe to run repeatedly — ensureOccurrencesForSeries skips dates
// that already have an events row.

cronAdd("extend-occurrences", "0 3 * * *", () => {
  const shared = require(`${__hooks}/shared.js`);
  const seriesRows = $app.findRecordsByFilter("event_series", "active = true", "", 500, 0, {});
  for (const series of seriesRows) {
    shared.ensureOccurrencesForSeries($app, series);
  }
});
