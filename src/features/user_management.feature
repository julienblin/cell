Feature: User management
  In order to allow other people to use the application
  As an admin user
  I want to be able to manage users of the application

  Background:
    Given an administrator named "Bob"
      And I am logged in as "Bob"


  Scenario: Listing existing users
    Given the following "User" entities:
      | username | email          | password | isAdmin | isActive |
      | Greg     | Greg@cgi.com   | password | true    | true     |
      | Martin   | Martin@cgi.com | password | false   | false    |
    When I visit the "users management" page
    Then I should see 3 lines in the table "#tableUsers"
