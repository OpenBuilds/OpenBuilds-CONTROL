function printLog(string) {
	if (string.isString) {
      string = string.replace(/\n/g, "<br />");
	}
    if ($('#console p').length > 300) {
        // remove oldest if already at 300 lines
        $('#console p').first().remove();
    }
    var template = '<p class="pf">';
    template += string;
    $('#console').append(template);
    $('#console').scrollTop($("#console")[0].scrollHeight - $("#console").height());
}
