var mailingListDialog;



$(document).ready(function() {
  if (localStorage.getItem('mailinglistID')) {

    // Already signed up once before
    console.log("Already Registered! Thank you!");
    console.log("Subscriber ID: " + localStorage.getItem('mailinglistID'));

    $("#registrationCardRegistration").html(localStorage.getItem('mailinglistFirstName') + " " + localStorage.getItem('mailinglistLastName') + " (" + localStorage.getItem('mailinglistID') + ")")
    $("#registrationCardRegistration").addClass("success")


  } else {

    $("#registrationCardRegistration").html("Not Registered")
    $("#registrationCardRegistration").addClass("alert")

    // Not signed up yet
    var mailinglistTemplate = `
    <div id="mailingListForm">

    <div class="text-small">
      We at OpenBuilds are excited to provide you with our free, user-friendly and powerful CNC CONTROL software! <br>
      Our mission is to empower both novices and experts to quickly and easily bring their ideas to life.
      <hr>
      To begin using our software, simply fill out the information below.  You will then receive software updates and be the first to hear about <a href=#" onclick="socket.emit('openbuilds');">OpenBuilds</a> and <a href=#" onclick="socket.emit('openbuildspartstore');">Part Store</a> announcements!
    </div>



      <form action="signUpMailinglist">

        <div class="row mt-4">

          <div class="cell-md-6">
            <input id="mailingListfname" data-validate="required minlength=3" type="text" placeholder="First name" class="metro-input" data-role="input" data-prepend="<span class='mif-user'></span>">
          </div>

          <div class="cell-md-6">
            <input id="mailingListlname" data-validate="required minlength=3" type="text" placeholder="Last name" class="metro-input" data-role="input" data-prepend="<span class='mif-user'></span>">
          </div>

        </div>

        <div class="row mt-4">

          <div class="cell-md-12">
            <input  id="mailingListfmail" data-validate="required email" type="text" placeholder="Email Address" class="metro-input" data-role="input" data-prepend="<span class='mif-mail'></span>">
          </div>

        </div>

        <div class="row mt-4">
          <div class="cell-md-12">
            <div class="text-small">
              As a community-driven organization, we truly appreciate the continuous support we receive from our users, and offering this software is just one of the many ways we give back. <br>
              Thank you for being a part of the OpenBuilds community, and for your ongoing support!
            </div>
          </div>
        </div>

        <div class="row mt-4">
          <div class="cell-md-12">
            <div class="float-right">
              <button id="mailingListSubmitButton" class="button primary" onclick="signUpMailinglist()">Register</button>
            </div>
          </div>
        </div>

      </form>
    </div>
    <div id="mailingListResultSuccess" style="display: none;">
      <div class="remark success">
      Succesfully Registered! Thank you!
      </div>
    </div>
    <div id="mailingListResultFail" style="display: none;">
      <div class="remark alert">
      Registration Failed. Please try again.
      <hr>
      <span id="mailingListErrorMsg"></span>
      </div>
    </div>


    `

    mailingListDialog = Metro.dialog.create({
      title: "<i class='fas fa-user'></i> Registration",
      content: mailinglistTemplate,
      toTop: true,
      width: '60%',
      clsDialog: 'dark',
      defaultAction: false
      // {
      //   caption: "Cancel",
      //   cls: "js-dialog-close",
      //   onclick: function() {
      //     //
      //   }
      // },
      // {
      //   caption: "Register",
      //   cls: "js-dialog-close success",
      //   onclick: function() {
      //     createSurfaceGcode()
      //   }
      // }
      // {
      //   caption: "Cancel",
      //   cls: "js-dialog-close",
      //   onclick: function() {
      //     // do nothing
      //   }
      // }
      //]
    });

  }
});

function mailingListForm(data) {
  console.log(data);
}

function signUpMailinglist() {

  m_fname = $("#mailingListfname").val();
  m_lname = $("#mailingListlname").val();
  m_email = $("#mailingListfmail").val();

  $("#mailingListSubmitButton").attr('disabled', true);
  $("#mailingListSubmitButton").addClass("disabled");
  $("#mailingListSubmitButton").html("Registering...");
  $("#mailingListResultFail").hide();
  $("#mailingListResultSuccess").hide();


  $.ajax({
    url: "https://openbuilds.com/mailinglist",
    type: "GET",
    crossDomain: true,
    data: {
      m_email: m_email,
      m_fname: m_fname,
      m_lname: m_lname,
      m_source: "OpenBuildsCONTROL",
    },

    success: function(response) {
      var data = JSON.parse(response)
      console.log(data)
      var successfulSignup = false;
      if (data.result == 1) {
        successfulSignup = true;
      } else if (data.message.indexOf("is in the system already") != -1) {
        successfulSignup = true;
      } else {
        $("#mailingListErrorMsg").html(data.message)
      }

      if (successfulSignup == true) {

        if (data.response.subscriber_id != undefined) {
          localStorage.setItem('mailinglistID', data.response.subscriber_id);
          console.log("Thank you for registering: New Registration Added");
        } else if (data.response[0].subscriberid != undefined) {
          localStorage.setItem('mailinglistID', data.response[0].subscriberid);
          console.log("Thank you for registering: Existing Registration Found");
        }

        $("#mailingListSubmitButton").html("Registered!").addClass("disabled").removeClass("primary").addClass("success");
        $("#mailingListForm").hide();
        $("#mailingListResultSuccess").show();

        setTimeout(function() {
          Metro.dialog.close(mailingListDialog);
        }, 3000);

        localStorage.setItem('mailinglistEmail', m_email);
        localStorage.setItem('mailinglistFirstName', m_fname);
        localStorage.setItem('mailinglistLastName', m_lname);

        $("#registrationCardRegistration").html(localStorage.getItem('mailinglistFirstName') + " " + localStorage.getItem('mailinglistLastName') + " (" + localStorage.getItem('mailinglistID') + ")")
        $("#registrationCardRegistration").addClass("success").removeClass("alert")


      } else {
        $("#mailingListForm").show();
        $("#mailingListResultFail").show();
        $("#mailingListSubmitButton").html("Register").removeClass("disabled").addClass("primary").removeClass("success");
        $("#mailingListSubmitButton").attr('disabled', false);
      }


    },
    error: function(xhr, status) {
      $("#mailingListSubmitButton").html("Registration Failed!").addClass("disabled").removeClass("primary").addClass("alert");
      $("#mailingListSubmitButton").attr('disabled', true);
      $("#mailingListForm").hide();
      $("#mailingListResultFail").show();
      $("#mailingListErrorMsg").html("Network Error")

      console.log(xhr, status)
      setTimeout(function() {
        Metro.dialog.close(mailingListDialog);
      }, 3000);
    }
  });

}