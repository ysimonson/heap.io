function testEmber() {
    /*module("Ember.js adapter");

    var checkErnest = function(foundErnest) {
        equal(foundErnest.get("id"), ernest.get("id"));
        equal(foundErnest.get("first"), ernest.get("first"));
        equal(foundErnest.get("last"), ernest.get("last"));
        equal(foundErnest.get("age"), ernest.get("age"));
        
        var books = ernest.get("books"), foundBooks = foundErnest.get("books");
        equal(foundBooks.get("length"), books.get("length"));

        books.forEach(function(book) {
            var filteredFoundBooks = foundBooks.filter(function(foundBook) {
                return foundBook.get("id") == book.get("id");
            });

            equal(filteredFoundBooks.get("length"), 1);

            var foundBook = filteredFoundBooks.get(0);
            equal(foundBook.get("name"), book.get("name"));
            equal(foundBook.get("age"), book.get("age"));
        });
    }

    var emberReady = function() {
        test("Update", function() {
            yusuf.set("first", "Joseph");
            App.store.commit();
        });

        test("Delete", function() {
            App.store.deleteRecord(yusuf);
            App.store.commit();
        });

        test("Find", function() {
            checkErnest(App.store.find(App.Author, ernest.get("id")));
        });

        test("Find All", function() {
            var people = App.store.findAll(App.Person);
            equal(people.get("length"), 2);
        });

        test("Search", function() {
            checkErnest(App.store.find(App.Author, { first: "Ernest" }));
        });
    };

    var App = Em.Application.create();

    App.store = DS.Store.create({
        revision: 4,
        adapter: DS.HeapIOAdapter.create({ client: client, namespace: "ember-data" }) 
    })

    setTimeout(emberReady, 1000);

    var Person = DS.Model.extend({
        first: DS.attr("string"),
        last: DS.attr("string"),
        age: DS.attr("number")
    });

    var Book = DS.Model.extend({
        name: DS.attr("string"),
        year: DS.attr("number")
    });

    var Author = DS.Model.extend({
        person: DS.belongsTo('Person'),
        books: DS.hasMany('Book')
    });

    var sun = App.store.createRecord(Book, {
        name: "The Sun Also Rises",
        year: 1929    
    });

    var farewell = App.store.createRecord(Book, {
        name: "A Farewell to Arms",
        year: 1926
    });

    var bell = App.store.createRecord(Book, {
        name: "For Whom the Bell Tolls",
        year: 1940
    });

    var ernest = App.store.createRecord(Author, {
        first: "Ernest",
        last: "Hemingway",
        age: 112,
        books: [sun, farewell, bell]
    });

    var yusuf = App.store.createRecord(Person, {
        first: "Yusuf",
        last: "Simonson",
        age: 24
    });

    App.store.commit();*/
}