include_recipe "build-essential"
include_recipe "git"
include_recipe "nodejs"
include_recipe "mongodb::10gen_repo"
include_recipe "mongodb"

gem_package "knife-solo" do
  version "0.2.0"
end

node["npm_packages"].each do |npm_package|
	execute "install global npm package #{npm_package}" do
		command "npm -g install #{npm_package}"
		not_if { `npm -g list 2> /dev/null | grep #{npm_package}`.chomp =~ /#{npm_package}/ }
	end
end

ruby_block  "setup .bashrc" do
	block do
		file = Chef::Util::FileEdit.new("/home/vagrant/.bashrc")
		file.insert_line_if_no_match(
		  "# Vagrant dev",
		  "\n# Vagrant dev\neval \"$(grunt --completion=bash)\"\n. <(npm completion)\ncd #{node["root_src"]}"
		)
		file.write_file
	end
end