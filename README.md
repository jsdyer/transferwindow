# Transfer Window

[Open Transfer Window](https://coolcode.ca/transferwindow/) to compare scheduled route 555 connections, walking time and missed-transfer waits at Carvolth and Lougheed.

<!-- coolcode:guide -->
Choose a morning or evening arrival window at Carvolth or Lougheed. Compare two- to twenty-minute delays to see how many connections hold and which arrivals face the longest added wait.
<!-- /coolcode:guide -->

## Reading the records

The importer keeps stop visits at Carvolth Exchange and route 555, Expo Line and Millennium Line calls at Lougheed. The direction selector pairs one 555 leg with a different service. Options identify the trip headsign and bay or platform. The calculation chooses the first departure at or after scheduled arrival plus walking allowance, then repeats with the simulated delay. The final column measures the gap to the next distinct departure if that connection is missed. Only permitted boarding/alighting calls count. Weekly calendars, date-specific exceptions and trips continuing past midnight determine service. Onward searches continue to the end of the feed. A day offset marks the next available departure even when a service takes a weekend break. Walking allowances are personal estimates. Scheduled connections do not measure actual reliability.

The delay comparison includes distinct arrival times in the chosen window on the selected Pacific date. The start is inclusive and the end is exclusive, capped at midnight. Onward departures may occur on later dates. Each delay scenario uses the same arrivals and walking allowance. An arrival keeps its connection if it can still reach its original onward departure. The median and longest extra times use only arrivals with a known later departure and measure the difference between the two departure times. Arrivals without a baseline departure, or with a baseline but no reachable delayed departure before the feed ends, are counted separately.

## Sources and maintenance

[TransLink static GTFS schedule, update policy and terms](https://www.translink.ca/about-us/doing-business-with-translink/app-developer-resources/gtfs/gtfs-data). The published snapshot includes retrieval dates in UTC and its source coverage. The page filters the downloaded data on the device and does not transmit selections.

Daily. Run `python3 scripts/refresh.py`. Automatic updates validate before publishing. Run `node --test tests/*.test.mjs`, `python3 -m unittest discover -s tests -v` and `python3 scripts/build.py`.

Route and arrival data used in this product or service is provided by permission of TransLink. TransLink assumes no responsibility for the accuracy or currency of the Data used in this product or service.

<!-- schedule-reliability -->
## Schedule reliability

Public GitHub repositories can have scheduled workflows disabled after 60 days of inactivity. A separate weekly [schedule guard](.github/workflows/schedule-guard.yml) calls GitHub's enable-workflow API for an explicit list of refresh workflows and itself. It can restore workflows disabled for inactivity, preserves manually disabled workflows, and runs independently of collection failures.

The separate schedule guard remains a mitigation, not a scheduling guarantee. The independent [CoolCode refresh watchdog](https://github.com/jsdyer/jsdyer.github.io/blob/main/services/refresh-watchdog/README.md) is maintained in GitHub and uses the generated workflow and freshness registry; do not maintain another target list here. Using it requires installation on a Linux server and GitHub credentials with access to this repository. A generated target does not prove that a private server has adopted it; verify the installed service's report. The guard does not collect data, create dummy commits or change source/check timestamps. Successful collection and published data freshness still need monitoring.
<!-- /schedule-reliability -->
