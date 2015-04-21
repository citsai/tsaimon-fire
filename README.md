# tsaimon-fire
==============
Monitor the GE GeoSpring Hybrid Electric Water Heater.
-----------------------------------------------------
  - Remote Control (change Mode and Setpoint)
  - Scheduler
  - Historical Data
  - Customize Email alerts.

Equipment requirements
----------------------
  - GE Geospring Hybrid Water Heater (Generation 2+ .  The one made in USA)
  - Green-Bean Maker Module (http://market.firstbuild.com/products/greenbean)

Installation
-----------
Firebase:
  1.  Login/Create your Firebase Account (https://www.firebase.com/).
  2.  Create a new App to store the data to.
  3.  Add the following to the "rules" to index the time field:   
  *{   
    "rules": {  
        ".read": true,    
        ".write": true,   
        "history": {    
         ".indexOn": ["TimeStamp"]   
        },    
        "recent": {   
            ".indexOn": ["TimeStamp"]     
         },     
        "schedule": {     
             ".indexOn": ["Time"]   
         }    
     }   
  }*   

Server:

  1.  Install Nodejs.  Make sure it is nodejs **v0.10.xx** due to comaptibility issues with GEA-SDK and GEA-USB modules (https://nodejs.org/dist/)
  2.  Copy the server directory to local computer (i.e.: server/)
  3.  "cd server".
  4.  Install the Node packages:  "npm install".  
  5.  Edit the file "firedb.js" so that the URL link points to the firebase APP created earlier.  
  6.  Connect the green-bean to the Geospring and plug in the USB to the computer.
  7.  Start the server:  "sudo npm start".

Client:

  1.  Copy the Web Client Folder to local.
  2.  Edit the "firedb.js" so that the URL link points to the same firebase APP as the server.
  3.  Open the "Main.html" in a browser to begin monitoring!

Miscellaneous:
--------------
  * Some slower computers such as Rasberry Pi may crash due to the GEA-Adapter-USB timing out.  One can reduce the incidence by modifying the constant **DISCOVERY_INTERVAL** from 1000 to something higher like 7000 in "appliance.js" under the node_modules/gea-sdk/src/ directory.
  * Make sure you modify the mailer data info in Firebase in order to send the email alerts.  For more information, see the nodemailer (https://github.com/andris9/Nodemailer).
  * There is a slow memory leak that is not resolved.  Highly suggest that you use a production monitoring software such as PM2 to automatically restart when there is an error or memory usage exceed a certain threshold.
