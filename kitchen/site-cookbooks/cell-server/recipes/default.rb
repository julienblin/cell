include_recipe "build-essential"
include_recipe "git"
include_recipe "nodejs"
include_recipe "mongodb::10gen_repo"
include_recipe "mongodb"
include_recipe "nginx"
include_recipe "application"
include_recipe "application_nginx"

node["cell"].each do |name, values|
  
  user "cell-#{name}" do
    comment "User for cell application #{name}"
  end
  
  group "cell-#{name}" do
  end 
  
  application name do
    path "/opt/cell/#{name}"
    owner "cell-#{name}"
    group "cell-#{name}"
    repository "git@github.com:julienblin/cell.git"
    deploy_key "-----BEGIN RSA PRIVATE KEY-----\nMIIEpQIBAAKCAQEAzlXoqHrl4b9JlQWNt2sk6U+oKhKZ3o0dY6eAuDSCj6SW2fp/\ng4nnX24/eTz60/fKmu4eWNcV5ni66oenECnr4pWr01E7xKkSS1IzJibLXZwqF+LC\nrbObYgyc9XGXyh2mc2p+uFNIq90ztNa1F1ZCyANq7MmHrI9xAYL3/9fc8uzOHVbW\nEULWyNfahK0jCGq3b7tiQIyNxp02e2ROHK286V87kmmWJ7nHlE1VrWdi04eA6Ri2\nZlBQDskmimQ+2oYcQWZJHuDZYKaHUfFesUcWgOkJjqB+5OhL1wbHtHe+fzSikrsl\nbv4RyWdvzp3vid61QJiYRk8ICi+SV0bgOldErwIDAQABAoIBAHKlLTafwqciIAJb\nKZjmQYYZKnjmCPStN80tPsoa8whZDTBkjQFLWHGf0kjM5xlrrvlSoS3/pD2Ai2rQ\noLTMdjJZszUhB7KHtpB/RchG+ewzXvgSmNTm3Mkn9PYzfYFh5CBw5aQJMnG74IT0\nX35uAYEc1QZoG6h3svSCDsXq7OtURO0AeiB6Td2C1nTV9M0vK+gYR/hz/Z+Qo9zn\ne08N9K9cbUOjRbZRyHoyauzlGK6dPoiXDbkDydSBB1/uE+JOZ9t2/tHhL67FqY7H\nsgHFJSt+myoQ2suIt9oU6iVxJMQ1KbLBQxeojS8Idi+SrQ72OmnJ1yIPg24vA+Mv\no+mzg+ECgYEA6OtdID1nifD2hjsttY42u6PFVUmt+3CCnV7+XsGCuosMQX3sJrap\nGzjoVgF1t95xHk1+3fvWcY0DpC6ZJ2OcTtCVRkKlMbfRGoqIjwtTzHjJHjbugN5O\nUJV8OLcitE7rChSUu30QqfQe5EdevB/t1kjdgZsuvuQxIbEP611h0EcCgYEA4sgs\nll4Rjq0MAM/ip8Onyt8KOh8f/qXPqNV0EHcDVRAulXZjwFWxXYxDO0PW+Ec6xAjM\nQ6QZenM9r3U/KaDE+hHYfUd1Y/jw7MwDMK8GfT/ut4ZZFN8UrY1LQad4NCZY4VAU\nvaepg/UFPicqTW2oa+VvsIT5sXOXP9RoJYRlRFkCgYEAveT+BMXrPywkYSWoS4gJ\nmYuY28L5RLDi3FjRPAG6iknJETAPszRixJ3t1gjUp7aENPdrgqHKoMMd/+I53UI5\n8ovd1+2H7vP1WBUv5qeOh3rGRYr1gj08TjjBkR/F/IkG2S4UYJNDXbx43xZM50WE\ny5qWdQ9G2j0CzXwlBXgZwgsCgYEA2bAmxKxFlDxeAkWLH1j7rwyMZ6BK+Qi3HizP\nfaKQa03eOZBsTkqzt8WVH8WOC8NsEJMVaHSUFGucsdkNKWtuyVDqC8/VSoLC2bs3\n8LqBsyb0geyPhC5jTfkMXVhhVUXeGWHilu7jFIzVXIUB4VM60V9q5/mtKX54mEfP\nNPwyrPkCgYEApKxAtO1tS/kwK+rvEq94cUPlCONQn5ERnytl6gUQ7lHwzzDhWxnB\nodJupJ8WMEHFlybS53Tj94bpC3LQ9pSNTK4rUjrLTFttxr9Txyoa4fO+T67mToL1\nkcXP1rgebHWr5U/W5d7o9k7YmofNCO1JbK/Kp1YbhkBM+BNJqq4C5tc=\n-----END RSA PRIVATE KEY-----\n"
  end
  
  execute "install project npm packages" do
  	command "cd #{"/opt/cell/#{name}/current/src"} && npm install --no-bin-links"
  	timeout 72000
  end
end