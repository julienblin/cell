include_recipe "build-essential"
include_recipe "git"
include_recipe "nodejs"
include_recipe "mongodb::10gen_repo"
include_recipe "mongodb"

node["npm_packages"].each do |npm_package|
	execute "install npm package #{npm_package}" do
		command "npm -g install #{npm_package}"
		not_if { `npm -g list 2> /dev/null | grep #{npm_package}`.chomp =~ /#{npm_package}/ }
	end
end

execute "setup default redirect to /cell" do
	command 'echo "cd /cell" >> /home/vagrant/.bashrc'
	not_if { `cat /home/vagrant/.bashrc | grep /cell`.chomp =~ /cell/ }
end