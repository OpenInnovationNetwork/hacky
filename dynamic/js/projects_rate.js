$(function(){

  /* PERSONALIZE THIS CONTENT FOR YOUR FORKED COPY */
  repository_user = "OpenInnovationNetwork"; //eg. in github.com/OpenInnovationNetwork/Projects/, it is "OpenInnovationNetwork"
  repository_name = "hacky"; //eg. in github.com/OpenInnovationNetwork/Projects/, it is "Projects"
  access_token = ""; //replace the text between "" with your personal access token

  // CLICK TO RATE
  $(document).on("submit", "form.form-rate-project", function(e) {

    e.preventDefault();

    project_filename = $(this).data("filename");
    file_path = "dynamic/projects/rates/rate_" + project_filename;

    // Rate data
    var rate_project_data = new Object();
    rate_project_data.project_filename = project_filename;
    rate_project_data.original_repository_user = repository_user;
    rate_project_data.original_repository_name = repository_name;
    rate_project_data.rate = $(this).find("select.rate").val();

    content_json = JSON.stringify(rate_project_data);

    // Send rate
    $.ajax({
      url: "https://api.github.com/repos/"+repository_user+"/"+repository_name+"/contents/"+file_path+"?access_token="+access_token,
      method: "put",
      data: JSON.stringify({
        "message": "Rated project "+project_filename,
        "content": btoa(content_json) // convert to base64 for github api
      })
    }) 
    .success(function( response ) {
      $('#modal-success').openModal();
      console.log(response);
    })
    .error(function( response ) {
      $('#error-message').text(response.responseJSON.message);
      $('#modal-error').openModal();
      console.log(response.responseJSON.message);
    });
  
  });

});