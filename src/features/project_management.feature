Feature: Project management
  As an standard user
  I want to be able to create and open projects

  Background:
    Given the following User entities:
      | username | email        | password | isAdmin | isActive |
      | Bob      | Bob@cgi.com  | secret   | false   | true     |
      | Greg     | Greg@cgi.com | secret   | false   | true     |
    And the following Project entities owned by Bob:
      | clientName | projectName |
      | CGI        | Foo         |
      | CGI        | Bar         |
      | Acme       | Contoso     |
      | AcmeFoo    | Contoso     |
      | Microsoft  | Office      |
    And the following Project entities owned by Greg:
      | clientName | projectName |
      | AcmeMore   | Foo         |
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

  Scenario: Autocomplete on client names when creating projects, restricted to visible projects
    When I visit the home page
    And I click the New link
    And I fill the following values:
      | name        | value |
      | clientName  | Ac    |
    Then the page should contain Acme
     And the page should contain AcmeFoo
     But the page should not contain AcmeMore

  Scenario: Open a project
    When I visit the home page
    And I click the Open link
    Then the page should contain AcmeFoo
     And I should see 5 lines in the table "#tableProjects"
     But the page should not contain AcmeMore
    When I click the "#tableProjects tbody a" link
    Then I should be on the project page

  Scenario: Search a project
    When I visit the home page
    And I click the Open link
    And I click the Client link
    And I fill the following values:
      | name        | value |
      | clientName  | Micro |
    And I press the Search button
    Then I should see 1 line in the table "#tableProjects"
    When I click the "#tableProjects tbody a" link
    Then I should be on the project page
     And the page title should contain Microsoft