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

  Scenario: Create a new user
    When I visit the "users management" page
     And I click the "#linkNewUser" link
    Then I should be on the "new user" page
    When I fill the following values:
      | name     | value        |
      | username | Greg         |
      | email    | Greg@cgi.com |
      | password | password     |
      | confirm  | password     |
      | isAdmin  | false        |
      | isActive | true         |
     And I press the "Save" button
    Then I should be on the "users management" page
     And The flash message should contain "Greg"
