const mongoose = require('mongoose');
require('dotenv').config();

// Import Book model
const Book = require('./models/Book');

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas');
    seedBooks();
  })
  .catch(err => console.error('Could not connect to MongoDB Atlas', err));

// Book data by genre
const booksByGenre = {
  // Fiction
  "Fiction": [
    { title: "To Kill a Mockingbird", author: "Harper Lee", publicationYear: 1960, publisher: "J. B. Lippincott & Co.", description: "A novel about racial inequality and moral growth in the American South." },
    { title: "1984", author: "George Orwell", publicationYear: 1949, publisher: "Secker & Warburg", description: "A dystopian novel about totalitarianism, surveillance, and thought control." },
    { title: "The Great Gatsby", author: "F. Scott Fitzgerald", publicationYear: 1925, publisher: "Charles Scribner's Sons", description: "A novel about the American Dream, wealth, and social class in the 1920s." },
    { title: "Pride and Prejudice", author: "Jane Austen", publicationYear: 1813, publisher: "T. Egerton", description: "A romantic novel about manners, upbringing, and marriage in early 19th-century England." },
    { title: "The Catcher in the Rye", author: "J.D. Salinger", publicationYear: 1951, publisher: "Little, Brown and Company", description: "A novel about teenage alienation and identity." },
    { title: "The Lord of the Rings", author: "J.R.R. Tolkien", publicationYear: 1954, publisher: "Allen & Unwin", description: "An epic fantasy novel about a quest to destroy a powerful ring." },
    { title: "The Hobbit", author: "J.R.R. Tolkien", publicationYear: 1937, publisher: "Allen & Unwin", description: "A fantasy novel about a hobbit's journey to help reclaim a dwarf kingdom." },
    { title: "Brave New World", author: "Aldous Huxley", publicationYear: 1932, publisher: "Chatto & Windus", description: "A dystopian novel about a futuristic society controlled by technology and conditioning." },
    { title: "The Alchemist", author: "Paulo Coelho", publicationYear: 1988, publisher: "HarperOne", description: "A philosophical novel about following one's dreams and finding one's destiny." },
    { title: "The Kite Runner", author: "Khaled Hosseini", publicationYear: 2003, publisher: "Riverhead Books", description: "A novel about friendship, betrayal, and redemption set in Afghanistan." }
  ],
  
  // Science Fiction
  "Science Fiction": [
    { title: "Dune", author: "Frank Herbert", publicationYear: 1965, publisher: "Chilton Books", description: "An epic science fiction novel about politics, religion, and ecology on a desert planet." },
    { title: "Foundation", author: "Isaac Asimov", publicationYear: 1951, publisher: "Gnome Press", description: "A science fiction novel about the decline and rebirth of a galactic empire." },
    { title: "Neuromancer", author: "William Gibson", publicationYear: 1984, publisher: "Ace", description: "A cyberpunk novel that helped define the genre and coined the term 'cyberspace'." },
    { title: "The Hitchhiker's Guide to the Galaxy", author: "Douglas Adams", publicationYear: 1979, publisher: "Pan Books", description: "A comedic science fiction series about an ordinary human's adventures in space." },
    { title: "Ender's Game", author: "Orson Scott Card", publicationYear: 1985, publisher: "Tor Books", description: "A military science fiction novel about a child prodigy trained to fight an alien species." },
    { title: "The Martian", author: "Andy Weir", publicationYear: 2011, publisher: "Crown Publishing", description: "A science fiction novel about an astronaut stranded on Mars." },
    { title: "Snow Crash", author: "Neal Stephenson", publicationYear: 1992, publisher: "Bantam Books", description: "A cyberpunk novel exploring linguistics, anthropology, and computer science." },
    { title: "Ready Player One", author: "Ernest Cline", publicationYear: 2011, publisher: "Random House", description: "A science fiction novel set in a virtual reality world filled with 1980s pop culture references." },
    { title: "The Three-Body Problem", author: "Liu Cixin", publicationYear: 2008, publisher: "Chongqing Publishing", description: "A science fiction novel about humanity's first contact with an alien civilization." },
    { title: "Hyperion", author: "Dan Simmons", publicationYear: 1989, publisher: "Doubleday", description: "A science fiction novel structured like The Canterbury Tales, with multiple characters telling their stories." }
  ],
  
  // Mystery
  "Mystery": [
    { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", publicationYear: 2005, publisher: "Norstedts Förlag", description: "A mystery thriller about a journalist and a hacker investigating a wealthy family." },
    { title: "Gone Girl", author: "Gillian Flynn", publicationYear: 2012, publisher: "Crown Publishing", description: "A psychological thriller about a woman who disappears on her fifth wedding anniversary." },
    { title: "The Da Vinci Code", author: "Dan Brown", publicationYear: 2003, publisher: "Doubleday", description: "A mystery thriller about a symbologist uncovering a conspiracy involving the Catholic Church." },
    { title: "And Then There Were None", author: "Agatha Christie", publicationYear: 1939, publisher: "Collins Crime Club", description: "A mystery novel about ten strangers invited to an island who are murdered one by one." },
    { title: "The Hound of the Baskervilles", author: "Arthur Conan Doyle", publicationYear: 1902, publisher: "George Newnes", description: "A Sherlock Holmes novel about a supernatural hound haunting a family." },
    { title: "In the Woods", author: "Tana French", publicationYear: 2007, publisher: "Viking Press", description: "A mystery novel about a detective investigating a child's murder that resembles his own childhood trauma." },
    { title: "The Silence of the Lambs", author: "Thomas Harris", publicationYear: 1988, publisher: "St. Martin's Press", description: "A psychological thriller about an FBI trainee seeking help from an imprisoned serial killer." },
    { title: "The Big Sleep", author: "Raymond Chandler", publicationYear: 1939, publisher: "Alfred A. Knopf", description: "A hardboiled detective novel featuring private investigator Philip Marlowe." },
    { title: "Rebecca", author: "Daphne du Maurier", publicationYear: 1938, publisher: "Victor Gollancz", description: "A gothic novel about a young woman who marries a widower and is haunted by his first wife's presence." },
    { title: "The Woman in White", author: "Wilkie Collins", publicationYear: 1859, publisher: "All the Year Round", description: "One of the earliest mystery novels, involving identity theft and false imprisonment." }
  ],
  
  // Fantasy
  "Fantasy": [
    { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", publicationYear: 1997, publisher: "Bloomsbury", description: "The first book in the Harry Potter series about a young wizard attending a magical school." },
    { title: "A Game of Thrones", author: "George R.R. Martin", publicationYear: 1996, publisher: "Bantam Spectra", description: "The first book in A Song of Ice and Fire series, a political fantasy with multiple viewpoint characters." },
    { title: "The Name of the Wind", author: "Patrick Rothfuss", publicationYear: 2007, publisher: "DAW Books", description: "The first book in The Kingkiller Chronicle, about a legendary magician telling his life story." },
    { title: "The Way of Kings", author: "Brandon Sanderson", publicationYear: 2010, publisher: "Tor Books", description: "The first book in The Stormlight Archive, an epic fantasy series set in a world of storms and magic." },
    { title: "American Gods", author: "Neil Gaiman", publicationYear: 2001, publisher: "William Morrow", description: "A fantasy novel about old and new gods in modern America." },
    { title: "The Lion, the Witch and the Wardrobe", author: "C.S. Lewis", publicationYear: 1950, publisher: "Geoffrey Bles", description: "The first published book in The Chronicles of Narnia, about children discovering a magical world." },
    { title: "Mistborn: The Final Empire", author: "Brandon Sanderson", publicationYear: 2006, publisher: "Tor Books", description: "A fantasy novel about a rebellion against an immortal ruler in a world where ash falls from the sky." },
    { title: "The Colour of Magic", author: "Terry Pratchett", publicationYear: 1983, publisher: "Colin Smythe", description: "The first book in the Discworld series, a comedic fantasy set on a flat world carried by four elephants on a giant turtle." },
    { title: "Jonathan Strange & Mr Norrell", author: "Susanna Clarke", publicationYear: 2004, publisher: "Bloomsbury", description: "An alternative history novel about the return of magic to England during the Napoleonic Wars." },
    { title: "The Lies of Locke Lamora", author: "Scott Lynch", publicationYear: 2006, publisher: "Gollancz", description: "A fantasy novel about a talented con artist in a city resembling Venice." }
  ],
  
  // Historical Fiction
  "Historical Fiction": [
    { title: "All the Light We Cannot See", author: "Anthony Doerr", publicationYear: 2014, publisher: "Scribner", description: "A novel about a blind French girl and a German boy during World War II." },
    { title: "The Book Thief", author: "Markus Zusak", publicationYear: 2005, publisher: "Picador", description: "A novel about a girl living with a foster family in Nazi Germany, narrated by Death." },
    { title: "Wolf Hall", author: "Hilary Mantel", publicationYear: 2009, publisher: "Fourth Estate", description: "A novel about Thomas Cromwell's rise to power in the court of Henry VIII." },
    { title: "The Pillars of the Earth", author: "Ken Follett", publicationYear: 1989, publisher: "Macmillan", description: "A novel about the building of a cathedral in 12th-century England." },
    { title: "The Nightingale", author: "Kristin Hannah", publicationYear: 2015, publisher: "St. Martin's Press", description: "A novel about two sisters in France during World War II." },
    { title: "Outlander", author: "Diana Gabaldon", publicationYear: 1991, publisher: "Delacorte Press", description: "A novel about a World War II nurse who travels back in time to 18th-century Scotland." },
    { title: "The Other Boleyn Girl", author: "Philippa Gregory", publicationYear: 2001, publisher: "Touchstone", description: "A novel about Mary Boleyn, sister of Anne Boleyn, at the court of Henry VIII." },
    { title: "Memoirs of a Geisha", author: "Arthur Golden", publicationYear: 1997, publisher: "Alfred A. Knopf", description: "A novel about a geisha working in Kyoto, Japan, before and after World War II." },
    { title: "The Tattooist of Auschwitz", author: "Heather Morris", publicationYear: 2018, publisher: "Echo", description: "A novel based on the true story of a Holocaust survivor who was the tattooist at Auschwitz concentration camp." },
    { title: "Pachinko", author: "Min Jin Lee", publicationYear: 2017, publisher: "Grand Central Publishing", description: "A novel following four generations of a Korean family who move to Japan." }
  ],
  
  // Biography
  "Biography": [
    { title: "Steve Jobs", author: "Walter Isaacson", publicationYear: 2011, publisher: "Simon & Schuster", description: "A biography of Apple co-founder Steve Jobs." },
    { title: "Becoming", author: "Michelle Obama", publicationYear: 2018, publisher: "Crown Publishing", description: "A memoir by former First Lady of the United States Michelle Obama." },
    { title: "The Diary of a Young Girl", author: "Anne Frank", publicationYear: 1947, publisher: "Contact Publishing", description: "The diary of a Jewish girl hiding from the Nazis during World War II." },
    { title: "Educated", author: "Tara Westover", publicationYear: 2018, publisher: "Random House", description: "A memoir about growing up in a survivalist family and pursuing education." },
    { title: "Born a Crime", author: "Trevor Noah", publicationYear: 2016, publisher: "Spiegel & Grau", description: "A memoir about growing up in South Africa during apartheid." },
    { title: "The Glass Castle", author: "Jeannette Walls", publicationYear: 2005, publisher: "Scribner", description: "A memoir about a dysfunctional but vibrant family." },
    { title: "Alexander Hamilton", author: "Ron Chernow", publicationYear: 2004, publisher: "Penguin Press", description: "A biography of American founding father Alexander Hamilton." },
    { title: "I Know Why the Caged Bird Sings", author: "Maya Angelou", publicationYear: 1969, publisher: "Random House", description: "An autobiography about the early years of American writer Maya Angelou." },
    { title: "Long Walk to Freedom", author: "Nelson Mandela", publicationYear: 1994, publisher: "Little, Brown and Company", description: "An autobiography of South African anti-apartheid revolutionary and president Nelson Mandela." },
    { title: "Einstein: His Life and Universe", author: "Walter Isaacson", publicationYear: 2007, publisher: "Simon & Schuster", description: "A biography of physicist Albert Einstein." }
  ],
  
  // Self-Help
  "Self-Help": [
    { title: "Atomic Habits", author: "James Clear", publicationYear: 2018, publisher: "Avery", description: "A guide to building good habits and breaking bad ones." },
    { title: "The 7 Habits of Highly Effective People", author: "Stephen R. Covey", publicationYear: 1989, publisher: "Free Press", description: "A guide to personal and professional effectiveness." },
    { title: "How to Win Friends and Influence People", author: "Dale Carnegie", publicationYear: 1936, publisher: "Simon & Schuster", description: "A guide to improving interpersonal skills and relationships." },
    { title: "Thinking, Fast and Slow", author: "Daniel Kahneman", publicationYear: 2011, publisher: "Farrar, Straus and Giroux", description: "A book about the two systems that drive the way we think." },
    { title: "Man's Search for Meaning", author: "Viktor E. Frankl", publicationYear: 1946, publisher: "Beacon Press", description: "A book about finding meaning in difficult circumstances, based on the author's experiences in Nazi concentration camps." },
    { title: "The Power of Now", author: "Eckhart Tolle", publicationYear: 1997, publisher: "Namaste Publishing", description: "A guide to spiritual enlightenment through living in the present moment." },
    { title: "Daring Greatly", author: "Brené Brown", publicationYear: 2012, publisher: "Gotham Books", description: "A book about vulnerability, courage, and shame resilience." },
    { title: "The Four Agreements", author: "Don Miguel Ruiz", publicationYear: 1997, publisher: "Amber-Allen Publishing", description: "A practical guide to personal freedom based on ancient Toltec wisdom." },
    { title: "You Are a Badass", author: "Jen Sincero", publicationYear: 2013, publisher: "Running Press", description: "A guide to stop doubting your greatness and start living an awesome life." },
    { title: "The Subtle Art of Not Giving a F*ck", author: "Mark Manson", publicationYear: 2016, publisher: "HarperOne", description: "A counterintuitive approach to living a good life by focusing on what truly matters." }
  ],
  
  // Romance
  "Romance": [
    { title: "Pride and Prejudice", author: "Jane Austen", publicationYear: 1813, publisher: "T. Egerton", description: "A romantic novel about manners, upbringing, and marriage in early 19th-century England." },
    { title: "Outlander", author: "Diana Gabaldon", publicationYear: 1991, publisher: "Delacorte Press", description: "A novel about a World War II nurse who travels back in time to 18th-century Scotland." },
    { title: "Me Before You", author: "Jojo Moyes", publicationYear: 2012, publisher: "Penguin Books", description: "A romance novel about a young woman who becomes the caregiver for a wealthy man with quadriplegia." },
    { title: "The Notebook", author: "Nicholas Sparks", publicationYear: 1996, publisher: "Warner Books", description: "A romance novel about a couple who fall in love in the 1940s." },
    { title: "The Time Traveler's Wife", author: "Audrey Niffenegger", publicationYear: 2003, publisher: "MacAdam/Cage", description: "A romance novel about a man with a genetic disorder that causes him to time travel unpredictably." },
    { title: "The Fault in Our Stars", author: "John Green", publicationYear: 2012, publisher: "Dutton Books", description: "A romance novel about two teenagers with cancer who fall in love." },
    { title: "Redeeming Love", author: "Francine Rivers", publicationYear: 1991, publisher: "Multnomah", description: "A historical romance novel set during the California Gold Rush, inspired by the biblical book of Hosea." },
    { title: "The Hating Game", author: "Sally Thorne", publicationYear: 2016, publisher: "William Morrow Paperbacks", description: "A romance novel about two executive assistants who hate each other but are competing for the same promotion." },
    { title: "The Bride Test", author: "Helen Hoang", publicationYear: 2019, publisher: "Berkley", description: "A romance novel about a Vietnamese woman who is brought to America to be a potential bride for an autistic man." },
    { title: "Red, White & Royal Blue", author: "Casey McQuiston", publicationYear: 2019, publisher: "St. Martin's Griffin", description: "A romance novel about the son of the U.S. President falling in love with a British prince." }
  ],
  
  // Thriller
  "Thriller": [
    { title: "The Girl on the Train", author: "Paula Hawkins", publicationYear: 2015, publisher: "Riverhead Books", description: "A psychological thriller about an alcoholic woman who becomes involved in a missing person investigation." },
    { title: "Gone Girl", author: "Gillian Flynn", publicationYear: 2012, publisher: "Crown Publishing", description: "A psychological thriller about a woman who disappears on her fifth wedding anniversary." },
    { title: "The Silent Patient", author: "Alex Michaelides", publicationYear: 2019, publisher: "Celadon Books", description: "A psychological thriller about a woman who stops speaking after shooting her husband." },
    { title: "The Da Vinci Code", author: "Dan Brown", publicationYear: 2003, publisher: "Doubleday", description: "A mystery thriller about a symbologist uncovering a conspiracy involving the Catholic Church." },
    { title: "The Girl with the Dragon Tattoo", author: "Stieg Larsson", publicationYear: 2005, publisher: "Norstedts Förlag", description: "A thriller about a journalist and a hacker investigating a wealthy family." },
    { title: "Before I Go to Sleep", author: "S.J. Watson", publicationYear: 2011, publisher: "Harper", description: "A psychological thriller about a woman with anterograde amnesia who wakes up every day with no memory of who she is." },
    { title: "The Silence of the Lambs", author: "Thomas Harris", publicationYear: 1988, publisher: "St. Martin's Press", description: "A psychological thriller about an FBI trainee seeking help from an imprisoned serial killer." },
    { title: "Sharp Objects", author: "Gillian Flynn", publicationYear: 2006, publisher: "Shaye Areheart Books", description: "A psychological thriller about a reporter who returns to her hometown to cover a series of murders." },
    { title: "The Woman in the Window", author: "A.J. Finn", publicationYear: 2018, publisher: "William Morrow", description: "A psychological thriller about an agoraphobic woman who witnesses a crime in a neighboring house." },
    { title: "I Am Pilgrim", author: "Terry Hayes", publicationYear: 2013, publisher: "Atria Books", description: "A thriller about a former spy who is called out of retirement to track down a terrorist." }
  ],
  
  // Children's
  "Children's": [
    { title: "Harry Potter and the Philosopher's Stone", author: "J.K. Rowling", publicationYear: 1997, publisher: "Bloomsbury", description: "The first book in the Harry Potter series about a young wizard attending a magical school." },
    { title: "Charlotte's Web", author: "E.B. White", publicationYear: 1952, publisher: "Harper & Brothers", description: "A children's novel about a pig named Wilbur and his friendship with a barn spider named Charlotte." },
    { title: "The Lion, the Witch and the Wardrobe", author: "C.S. Lewis", publicationYear: 1950, publisher: "Geoffrey Bles", description: "The first published book in The Chronicles of Narnia, about children discovering a magical world." },
    { title: "Matilda", author: "Roald Dahl", publicationYear: 1988, publisher: "Jonathan Cape", description: "A children's novel about a girl with telekinetic abilities who loves reading." },
    { title: "The Very Hungry Caterpillar", author: "Eric Carle", publicationYear: 1969, publisher: "World Publishing Company", description: "A children's picture book about a caterpillar eating its way through various foods before pupating and emerging as a butterfly." },
    { title: "Where the Wild Things Are", author: "Maurice Sendak", publicationYear: 1963, publisher: "Harper & Row", description: "A children's picture book about a boy who sails to an island inhabited by monsters." },
    { title: "The Gruffalo", author: "Julia Donaldson", publicationYear: 1999, publisher: "Macmillan", description: "A children's book about a mouse who takes a walk in the forest and outwits predators by inventing a fearsome creature called the Gruffalo." },
    { title: "Goodnight Moon", author: "Margaret Wise Brown", publicationYear: 1947, publisher: "Harper & Brothers", description: "A bedtime story that features a bunny saying goodnight to everything around it." },
    { title: "The Cat in the Hat", author: "Dr. Seuss", publicationYear: 1957, publisher: "Random House", description: "A children's book about a cat who visits two children on a rainy day and creates chaos in their house." },
    { title: "A Wrinkle in Time", author: "Madeleine L'Engle", publicationYear: 1962, publisher: "Farrar, Straus and Giroux", description: "A science fantasy novel about a young girl whose father has gone missing after working on a mysterious project." }
  ]
};

// Function to seed books
async function seedBooks() {
  try {
    // Count existing books
    const existingCount = await Book.countDocuments();
    
    if (existingCount > 0) {
      console.log(`Database already has ${existingCount} books. Do you want to add more books? (y/n)`);
      process.stdin.once('data', async (data) => {
        const input = data.toString().trim().toLowerCase();
        
        if (input === 'y' || input === 'yes') {
          await addBooks();
        } else {
          console.log('Book seeding cancelled.');
          mongoose.disconnect();
        }
      });
    } else {
      await addBooks();
    }
  } catch (error) {
    console.error('Error seeding books:', error);
    mongoose.disconnect();
  }
}

// Function to add books to database
async function addBooks() {
  try {
    let totalAdded = 0;
    
    for (const [genre, books] of Object.entries(booksByGenre)) {
      console.log(`Adding ${books.length} books in ${genre} genre...`);
      
      for (const bookData of books) {
        // Generate a random ISBN (for demonstration purposes)
        const isbn = generateISBN();
        
        // Generate random number of copies (between 1 and 10)
        const totalCopies = Math.floor(Math.random() * 10) + 1;
        
        // Create book object
        const book = new Book({
          title: bookData.title,
          author: bookData.author,
          isbn: isbn,
          publicationYear: bookData.publicationYear,
          publisher: bookData.publisher,
          genre: genre,
          description: bookData.description,
          totalCopies: totalCopies,
          availableCopies: totalCopies,
          shelfLocation: `${genre.charAt(0)}${Math.floor(Math.random() * 100) + 1}`
        });
        
        // Save book to database
        await book.save();
        totalAdded++;
      }
    }
    
    console.log(`Successfully added ${totalAdded} books to the database!`);
    mongoose.disconnect();
  } catch (error) {
    console.error('Error adding books:', error);
    mongoose.disconnect();
  }
}

// Function to generate a random ISBN
function generateISBN() {
  let isbn = '978';
  
  // Generate 10 random digits
  for (let i = 0; i < 10; i++) {
    isbn += Math.floor(Math.random() * 10);
  }
  
  return isbn;
}
