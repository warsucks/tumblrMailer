var fs = require('fs');
var ejs = require('ejs');
var tumblr = require('tumblr.js');
var client = tumblr.createClient({
  consumer_key: '5aNyvDrkBgZHasxhRN1q2n4pKUPxkzdUyzYxLRUvmgUBUzbcPA',
  consumer_secret: 'XuLfth3fuq6026gDvWy38NWPVoELzci4HuGyMz38sTdutKbozn',
  token: 'uQimoAC6jCqadExhMcVowI4RvEQ3U6x3tJ0G3JVt5Zczin0llT',
  token_secret: 'wncxCBuNw0PdQtDOukQeyZbPxZo18C9UNEE9qyIze1QIctFmrD'
});
var mandrill = require('mandrill-api/mandrill');
var mandrill_client = new mandrill.Mandrill('GQWiPbAEJPk7Q9PKHvVI-g');

var friendListCSV = fs.readFileSync("friend_list.csv","utf8");
csvParse(friendListCSV);

var friends = csvParse(friendListCSV);

var emailTemplate = fs.readFileSync("email_template.ejs", "utf8");

client.posts('kathyandcomputer.tumblr.com',function (err, data)
{
	if(err)
	{
		throw err;
	}
	var posts = data.posts;
	var currentTimestamp = Date.now();
	var millisecondsPerWeek = 604800000;
	var weeksIntoPast = 2;

	var latestPosts = [];
	posts.forEach(function(post)
	{
		var postTimestamp = post.timestamp*1000;

		if(currentTimestamp- postTimestamp<=weeksIntoPast*millisecondsPerWeek)
		{
			latestPosts.push(post);
		}
	});

	friends.forEach(function(element)
	{
		var renderData = 
		{
			firstName: element.firstName,
			relationship: element.relationship,
			interest1: element.interest1,
			interest2: element.interest2
		};
		renderData.latestPosts = latestPosts;
		var personalizedEmail = ejs.render(emailTemplate, renderData);
		sendEmail(element.firstName+" "+element.lastName, element.emailAddress, "Kathy Lu", "kaffy.lu@gmail.com", "Robot email", personalizedEmail)
	});

});

function csvParse(csvFile)
{
	var lines = csvFile.split("\n")
	lines.pop();//empty line at end
	lines = lines.map(function(element)
	{
		return element.split(",");
	});

	var columns = lines[0];
	lines.splice(0,1);

	var entries = [];

	lines.forEach(function(line)
	{
		var entry = {};
		columns.forEach(function(col, index)
		{
			entry[col] = line[index];
		});
		entries.push(entry);
	});

	return entries;
}

function sendEmail(to_name, to_email, from_name, from_email, subject, message_html)
{
    var message = 
    {
        "html": message_html,
        "subject": subject,
        "from_email": from_email,
        "from_name": from_name,
        "to": [{
                "email": to_email,
                "name": to_name
            }],
        "important": false,
        "track_opens": true,    
        "auto_html": false,
        "preserve_recipients": true,
        "merge": false,
        "tags": [
            "Fullstack_Tumblrmailer_Workshop"
        ]    
    };
    var async = false;
    var ip_pool = "Main Pool";
    mandrill_client.messages.send({"message": message, "async": async, "ip_pool": ip_pool}, function(result) {
        // console.log(message);
        // console.log(result);   
    }, function(e) {
        // Mandrill returns the error as an object with name and message keys
        console.log('A mandrill error occurred: ' + e.name + ' - ' + e.message);
        // A mandrill error occurred: Unknown_Subaccount - No subaccount exists with the id 'customer-123'
    });

    console.log("email sent to "+ to_email);
 }