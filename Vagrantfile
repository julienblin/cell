Vagrant.configure("2") do |config|

	config.vm.define :cell do |cell|
		cell.vm.box = "precise64"
		cell.vm.box_url = "http://files.vagrantup.com/precise64.box"
		cell.vm.network :forwarded_port, guest: 3000, host: 3000   # cell app
		cell.vm.network :forwarded_port, guest: 8080, host: 8080   # node-inspector
		cell.vm.network :forwarded_port, guest: 28017, host: 28017 # mongodb http console
		cell.vm.synced_folder ".", "/cell"
		
    cell.vm.provider "virtualbox" do |v|
      v.name = "Cell-dev"
      v.customize ["modifyvm", :id, "--memory", "512"]
    end
    
		cell.vm.provision :chef_solo do |chef|
			chef.cookbooks_path = ["kitchen/cookbooks", "kitchen/site-cookbooks"]
			chef.add_recipe "cell-dev"
			chef.json = {
				"nodejs" => {
					"version" => "0.10.11",
					"install_method" => "binary",
					"checksum_linux_x64" => "0fa2be9b44d6acd4bd43908bade00053de35e6e27f72a2dc41d072c86263b52a"
				},
				
				"mongodb" => {
					"package_version" => "2.4.4"
				},
				
				"npm_packages" => [ "grunt-cli@0.1.9", "node-inspector@0.3.2" ],
				
				"root_src" => "/cell/src"
			}
		end
	end
end
