Feature: User management
  In order to allow other people to use the application
  As an admin user
  I want to be able to manage users of the application

  Background:
    Given the following "User" entity:
      | username | email          | password | isAdmin | isActive |
      | Bob      |  Bob@cgi.com   | password | true    | true     |
      And I am logged in as "Bob", "password"


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

  Scenario: Edit a user
    When I visit the "users management" page
     And I click the "#tableUsers tbody a" link
    Then I should be on the "edit user" page
    When I fill the following values:
      | name     | value        |
      | email    | Foo@bar.com  |
     And I press the "Save" button
    Then I should be on the "users management" page
     And The flash message should contain "Bob"
     And The page should contain "Foo@bar.com"
