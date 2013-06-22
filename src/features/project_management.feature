Feature: Project management
  As an standard user
  I want to be able to create and open projects

  Background:
    Given the following User model:
      | username | email       | password | isAdmin | isActive |
      | Bob      | Bob@cgi.com | secret   | false   | true     |
    And I am logged in as Bob using secret


  Scenario: Create a new project
    When I visit the home page
     And I click the New link
     And I fill the following values:
       | name        | value         |
       | clientName  | CGI           |
       | projectName | CellFeatures  |
     And I press the Create button
    Then I should be on the project page
     And the page title should contain CGI
     And the page title should contain CellFeatures