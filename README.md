Cell
====

Next generation estimation web application.

Getting started
---------------

Just install [Vagrant](http://www.vagrantup.com/) and [VirtualBox](https://www.virtualbox.org/), then open a command prompt and:

	vagrant up
	vagrant ssh
	npm start
	
Open a browser to [http://localhost:3000/](http://localhost:3000/).

To launch the complete test suite (inside the vagrant vm):

	grunt

To prepare the deployment on a target server:
* install [Precise Pangolin x64](http://releases.ubuntu.com/precise/) minimal with an OpenSSH server
* in the VM run:

<!-- break md -->

	cd /cell/kitchen
	knife solo bootstrap --omnibus-version $(knife solo prepare -v | cut -c7-) <username>@<host> nodes/cell-default-server.json
