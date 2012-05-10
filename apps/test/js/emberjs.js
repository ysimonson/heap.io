function testEmber() {
    module("Ember.js adapter");

    var checkErnest = function(foundErnest, asAuthor) {
        equal(foundErnest.get("first"), ernestTheAuthor.get("first"));
        equal(foundErnest.get("last"), ernestTheAuthor.get("last"));
        equal(foundErnest.get("age"), ernestTheAuthor.get("age"));

        if(asAuthor) {
            var books = ernestTheAuthor.get("books"), foundBooks = foundErnest.get("books");
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
    }

    var emberReady = function() {
        asyncTest("Delete", function() {
            setTimeout(function() {
                expect(0);
                App.store.deleteRecord(noNameBook);
                App.store.commit();
                start();
            }, 100);
        });

        test("Update", function() {
            yusuf.set("first", "Joseph");
            App.store.commit();

            var foundYusuf = App.store.find(App.Person, yusuf.get("id"));
            equal(foundYusuf.get("first"), "Joseph");
        });

        test("Find", function() {
            var foundErnest = App.store.find(App.Author, ernestTheAuthor.get("id"));
            checkErnest(foundErnest, true);
        });

        test("Find All", function() {
            var people = App.store.findAll(App.Person);
            equal(people.get("length"), 2);

            for(var i=0; i<2; i++) {
                var person = people.objectAt(i);
                ok(person == ernest || person == yusuf);
            }
        });

        test("Search", function() {
            var foundErnest = App.store.find(App.Person, { first: "Ernest" });
            checkErnest(foundErnest, false);
        });
    };

    var App = Em.Application.create();

    App.store = DS.Store.create({
        revision: 4,
        adapter: DS.HeapIOAdapter.create({ client: client, namespace: "ember-data" }) 
        //adapter: DS.RESTAdapter.create({ bulkCommit: false })
    })

    setTimeout(emberReady, 1000);

    App.Person = DS.Model.extend({
        first: DS.attr("string"),
        last: DS.attr("string"),
        age: DS.attr("number")
    });

    App.Book = DS.Model.extend({
        name: DS.attr("string"),
        year: DS.attr("number")
    });

    App.Author = DS.Model.extend({
        person: DS.belongsTo('Person'),
        books: DS.hasMany('Book')
    });

    var sun = App.store.createRecord(App.Book, {
        name: "The Sun Also Rises",
        year: 1929    
    });

    var farewell = App.store.createRecord(App.Book, {
        name: "A Farewell to Arms",
        year: 1926
    });

    var bell = App.store.createRecord(App.Book, {
        name: "For Whom the Bell Tolls",
        year: 1940
    });

    var noNameBook = App.store.createRecord(App.Book, {
        name: "?",
        year: 1999
    });

    var ernest = App.store.createRecord(App.Person, {
        first: "Ernest",
        last: "Hemingway",
        age: 112
    });

    var ernestTheAuthor = App.store.createRecord(App.Author, {
        person: ernest,
        books: [sun, farewell, bell]
    });

    var yusuf = App.store.createRecord(App.Person, {
        first: "Yusuf",
        last: "Simonson",
        age: 24
    });

    App.store.commit();
}