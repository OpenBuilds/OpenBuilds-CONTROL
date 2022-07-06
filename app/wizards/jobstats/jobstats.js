var pastJobs = []

$(document).ready(function() {
  if (localStorage.getItem('pastJobs')) {
    pastJobs = JSON.parse(localStorage.getItem('pastJobs'));
  };
});

function storeJob(completedJob) {
  // var completedJob = {
  //   "completed": !data.failed, // Did job complete?
  //   "filename": loadedFileName, // File Name
  //   "estruntime": estimateTime, // in Minutes
  //   "streamruntime": runTime,
  //   "startdate": startDate,
  //   "enddate": endDate
  // }
  pastJobs.unshift(completedJob)
  if (pastJobs.length > 50) {
    pastJobs.length = 50;
  }
  localStorage.setItem('pastJobs', JSON.stringify(pastJobs));
  console.log(JSON.stringify(pastJobs, false, 4))
}

function showJobLog() {

  var options = {
    weekday: "short",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  };

  var template = `
  <div style="height: calc(100vh - 550px); min-height: 90px; overflow-x: auto;">
  <table class="table striped compact">
    <thead>
      <tr>
        <th style="width: 50px;">Status</th>
        <th>Date</th>
        <th>Name</th>
        <th>Time</th>
      </tr>
    </thead>
    <tbody>
    `

  for (i = 0; i < pastJobs.length; i++) {
    var date = new Date(pastJobs[i].startdate).toDateString()
    var time = new Date(pastJobs[i].startdate).toLocaleTimeString([], {
      // year: 'numeric',
      // month: 'numeric',
      // day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
    template += `<tr>`
    if (pastJobs[i].completed) {
      template += `<td class="pt-1 mt-0 pb-0 pt-0"><i class="fas fa-check fg-darkGreen"></td>`
    } else {
      template += `<td class="pt-1 mt-0 pb-0 pt-0"><i class="fas fa-times fg-darkRed"></td>`
    }
    template += `<td class="pt-1 mt-0 pb-0 pt-0">` + date + ", " + time + `</td>`
    template += `<td class="pt-1 mt-0 pb-0 pt-0"><div style="max-width: 160px !important; word-wrap: break-word;">` + pastJobs[i].filename + `</div></td>`
    template += `<td class="pt-1 mt-0 pb-0 pt-0">` + timeConvert(pastJobs[i].estruntime) + ` (Estimate)<br>` + msToTime(pastJobs[i].streamruntime) + ` (Streamed)</td>`
    template += `</tr>`
  }

  template += `</tbody>
</table></div>`

  Metro.dialog.create({
    title: "<i class='far fa-keyboard fa-fw'></i> Log: Jobs",
    content: template,
    toTop: true,
    width: 600,
    clsDialog: 'dark',
    actions: [{
        caption: "Close",
        cls: "js-dialog-close",
        onclick: function() {
          //
        }
      },
      // {
      //   caption: "Cancel",
      //   cls: "js-dialog-close",
      //   onclick: function() {
      //     // do nothing
      //   }
      // }
    ]
  });
}