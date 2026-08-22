THE STYLE KATHA — "Shop by Collection" section
==============================================
Files in this zip go NEXT TO your index.html.

1. Copy  collections.css, collections.js  and the  assets/collections/  folder
   into your site root (same folder as index.html).

2. index.html — in <head>, after your existing stylesheet:
      <link rel="stylesheet" href="collections.css">

3. index.html — paste the <section> from collections-snippet.html just ABOVE
   your existing <section id="collection"> (the product grid section).

4. index.html — before </body>, AFTER main.js:
      <script src="collections.js"></script>

Nothing in admin.html needs to change. Your admin already manages categories;
collections.js matches each circle to a Supabase category by name/slug and calls
your existing setCategoryFilter(). If a category doesn't exist yet it falls back
to filtering the visible cards by text.

Optional: run seed-categories.sql in Supabase (SQL editor) to create the nine
categories so filtering is exact. Adjust the id/column names if your categories
table differs.
