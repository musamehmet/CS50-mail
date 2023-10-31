document.addEventListener('DOMContentLoaded', function () {

  // Use buttons to toggle between views
  document.querySelector('#inbox').addEventListener('click', () => load_mailbox('inbox'));
  document.querySelector('#sent').addEventListener('click', () => load_mailbox('sent'));
  document.querySelector('#archived').addEventListener('click', () => load_mailbox('archive'));
  document.querySelector('#compose').addEventListener('click', compose_email);
  document.querySelector("#compose-form").addEventListener('submit', send_email);
  // By default, load the inbox
  load_mailbox('inbox');
});

function compose_email() {

  // Show compose view and hide other views
  document.querySelector('#emails-view').style.display = 'none';
  document.querySelector('#compose-view').style.display = 'block';
  document.querySelector('#email-detail-view').style.display = 'none';
  document.querySelector('#page-header').innerHTML = "New E-Mail";


  // Clear out composition fields
  document.querySelector('#compose-recipients').value = '';
  document.querySelector('#compose-subject').value = '';
  document.querySelector('#compose-body').value = '';
}

function load_mailbox(mailbox) {

  // Show the mailbox and hide other views
  document.querySelector('#emails-view').style.display = 'block';
  document.querySelector('#compose-view').style.display = 'none';
  document.querySelector('#email-detail-view').style.display = 'none';

  // Show the mailbox name

  document.querySelector('#page-header').innerHTML = `<h3>${mailbox.charAt(0).toUpperCase() + mailbox.slice(1)}</h3>`;
  document.querySelector('#emails-view').innerHTML = "";

  fetch(`/emails/${mailbox}`)
    .then(response => response.json())
    .then(emails => {
      emails.forEach(contentEmail =>{
            const newEmail = document.createElement('div');
            newEmail.className = "list-group-item mail-box";
            newEmail.style.cursor = "pointer";
            newEmail.innerHTML = `
            <div class="d-flex justify-content-between align-items-center p-2">
            <div class="col-3"><text>${ contentEmail.sender}</text></div>
            <div class="col-6 mx-3"><text>${ contentEmail.subject}</text></div>
            <div class="col-3"><text>${ contentEmail.timestamp}</text></div>
            </div>
            `;
            newEmail.className = contentEmail.read ? 'read': 'unread';

            newEmail.addEventListener('click', function() {
              view_email(contentEmail.id)});
            document.querySelector('#emails-view').append(newEmail);
      })      
    });

}

function send_email(event) {
  event.preventDefault();

  // Clear out composition fields
  const composeRecipients = document.querySelector('#compose-recipients').value;
  const composeSubject = document.querySelector('#compose-subject').value;
  const composeBody = document.querySelector('#compose-body').value;

  fetch('/emails', {
    method: 'POST',
    body: JSON.stringify({
      recipients: composeRecipients,
      subject: composeSubject,
      body: composeBody
    })
  })
    .then(response => response.json())
    .then(result => {
      load_mailbox('sent');
    });
}

function view_email(id){
    fetch(`/emails/${id}`)
    .then(response => response.json())
    .then(email => {       
        document.querySelector('#emails-view').style.display = 'none';
        document.querySelector('#compose-view').style.display = 'none';
        document.querySelector('#email-detail-view').style.display = 'block';

        document.querySelector('#email-detail-view').innerHTML = `
        <div class="email-details">
        <ul class="list-group-flush p-0">
          <li class="list-group-item email-detail-group"><strong>From:</strong> ${email.sender}</li>
          <li class="list-group-item email-detail-group"><strong>To:</strong> ${email.recipients}</li>
          <li class="list-group-item email-detail-group"><strong>Subject:</strong> ${email.subject}</li>
          <li class="list-group-item email-detail-group"><strong>Timestamp:</strong> ${email.timestamp}</li>
        </ul>        
        <p>${email.body}</p>
        </div>
        `
        if(!email.read){
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                read: true
            })
          })
        }

        const btnArch = document.createElement('button');
        btnArch.innerHTML = email.archived ? "Unarchive" : "Archive"
        btnArch.className = email.archived ? "btn btn-outline-success email-detail-button" : "btn btn-outline-warning email-detail-button"
        btnArch.addEventListener('click', function() {
          fetch(`/emails/${email.id}`, {
            method: 'PUT',
            body: JSON.stringify({
                archived: !email.archived
            })
          })
          .then(()=> { load_mailbox('archive')})
        });
        document.querySelector('#email-detail-view').append(btnArch);

        const btnReply = document.createElement('button');
        btnReply.innerHTML = "Reply"
        btnReply.className = "btn btn-outline-primary";
        btnReply.addEventListener('click', function() {
          compose_email();
          let subject = email.subject;
          if (subject.split(' ',1)[0] != "Re:"){
            subject = "Re: " + email.subject;
          }
          document.querySelector('#compose-recipients').value = email.sender;
          document.querySelector('#compose-subject').value = subject;   
          document.querySelector('#compose-body').value = "On" + " " + email.timestamp + " " + email.sender + " " + "wrote: " + email.body;  
        });
        document.querySelector('#email-detail-view').append(btnReply);
    });
    
}