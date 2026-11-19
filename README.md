# Transfer Window

[Open Transfer Window](https://coolcode.ca/transferwindow/) to compare scheduled route 555 connections, walking time and missed-transfer waits at Carvolth and Lougheed.

<!-- coolcode:guide -->
Try a 555 arrival at Lougheed, select your onward train, then add a five-minute delay to see which scheduled departures remain reachable.
<!-- /coolcode:guide -->

## Reading the records

The importer keeps stop visits at Carvolth Exchange and route 555, Expo Line and Millennium Line calls at Lougheed. The direction selector pairs one 555 leg with a different service. Options identify the trip headsign and bay or platform. The calculation chooses the first departure at or after scheduled arrival plus walking allowance, then repeats with the simulated delay. The final column measures the gap to the next distinct departure if that connection is missed. Only permitted boarding/alighting calls count. Weekly calendars, date-specific exceptions and trips continuing past midnight determine service. The feed limits the available date range. Walking allowances are personal estimates. Scheduled connections do not measure actual reliability.

## Sources and maintenance

[TransLink static GTFS schedule, update policy and terms](https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources/gtfs/gtfs-data). The published snapshot includes retrieval dates in UTC and its source coverage. The page filters the downloaded data on the device and does not transmit selections.

Daily. Run `python3 scripts/refresh.py`. Automatic updates validate before publishing. Run `node --test tests/*.test.mjs`, `python3 -m unittest discover -s tests -v` and `python3 scripts/build.py`.

Route and arrival data used in this product or service is provided by permission of TransLink. TransLink assumes no responsibility for the accuracy or currency of the Data used in this product or service.
