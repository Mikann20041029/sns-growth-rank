fetch("https://www.reddit.com/r/all/hot.json?limit=20")
  .then(r => r.json())
  .then(d => {
    const items = d.data.children.map((c,i)=>({
      rank:i+1,
      title:c.data.title,
      score:c.data.score,
      url:"https://reddit.com"+c.data.permalink
    }));
    console.log(items);
  });
