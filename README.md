Pebble Thermostat Setter
========================

Pebble smart watch application to set the temperature of a home by controlling a wi-fi thermostat from the watch.

The application supports multiple thermostats. The middle button selects a specific thermostat, while the up and down buttons raise and lower the temperature of the selected thermostat. The watch display shows the name of the selected thermostat and its temperature (see image below).

![Watch App](https://raw.githubusercontent.com/jose-troche/Documentation/master/PebbleThermostatSetter/PebbleThermostatSetterDiagram.png)

The application is self contained and has no external dependencies, except for the Pebble SDK.

Installing the Application
==========================

* Install the Pebble SDK in your computer and the Pebble mobile app in your iPhone or Android device. More details [here](https://developer.getpebble.com/download-sdk)
* Pair the watch with the phone
* Clone this repo:
```
git clone git@github.com:jose-troche/PebbleThermostatSetter.git
```
* Compile and deploy:
```
pebble build
pebble install --logs
```
* Done!

The app will be deployed to the watch and the phone will display the settings page to configure username and password, which will be cached from then on.

![Mobile App](https://raw.githubusercontent.com/jose-troche/Documentation/master/PebbleThermostatSetter/ConfigurationSettings.png)

Understanding the source code
=============================
The heart of the implementation resides in the two files inside the `src` folder. The c file will be compiled and installed in the watch. The javascript file will be executed by the generic Pebble Application on the phone. So no new application has to be installed on the phone. Even more, the javascript file will run with no modifications in Android or iPhone.

The javascript file contains the logic that connects to the thermostat services in order to read and update their data, including temperature. The c file has the logic to display the information in the watch and the ability to exchange messages with the javascript file on the phone.

The javascript file cannot be split in modules, but the c file can potentially be modularized. I decided to leave it as one file, because seems to be easier to follow the logic in a single place.

Architecture
============
Behind the scenes, the watch connects via Bluetooth to the mobile phone that has the Pebble Application, which in turn connects to the internet and sends the commands to the Wi-Fi thermostats. So the watch does not even need to be near the thermostats. In fact, the temperature can be controlled from the other side of the world, as long as the phone has internet connection.

Devices
=======
To have this app working you need the following devices:
* A Pebble smart watch
* An iPhone or Android device
* One or more Honeywell Wi-Fi thermostats

