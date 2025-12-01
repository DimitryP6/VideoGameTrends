d3.json('vgs_cleaned.json').then(function (data) {

  let
    width = 700,
    height = 500

  let margin = {
    top: 80,
    bottom: 40,
    left: 100,
    right: 140
  }

  let svg = d3.select('body')
    .append('svg')
    .attr('width', width)
    .attr('height', height)
    .style('background', '#fafafa')

  let chartWidth = width - margin.left - margin.right
  let chartHeight = height - margin.top - margin.bottom

  let publishers = [...new Set(data.map(d => d.publisher))]
  let genres = [...new Set(data.map(d => d.genre))]

  let totalCount = d3.sum(data, d => d.count)

  let publisherTotals = d3.rollup(data,
    v => d3.sum(v, d => d.count),
    d => d.publisher
  )

  let colorScale = d3.scaleOrdinal()
    .domain(genres)
    .range(d3.schemeTableau10)

  let xPos = 0
  let publisherX = new Map()
  let publisherWidth = new Map()

  publishers.forEach(pub => {
    publisherX.set(pub, xPos)
    let w = (publisherTotals.get(pub) / totalCount) * chartWidth
    publisherWidth.set(pub, w)
    xPos += w
  })

  let cellData = []

  publishers.forEach(pub => {
    let yPos = 0
    let pubTotal = publisherTotals.get(pub)

    genres.forEach(genre => {
      let item = data.find(d => d.publisher === pub && d.genre === genre)
      if (item) {
        let h = (item.count / pubTotal) * chartHeight
        cellData.push({
          publisher: item.publisher,
          genre: item.genre,
          count: item.count,
          platform: item.platform,
          percent: (item.count / pubTotal) * 100,
          x: publisherX.get(pub),
          y: yPos,
          width: publisherWidth.get(pub),
          height: h
        })
        yPos += h
      }
    })
  })

  let chart = svg.append('g')
    .attr('transform', `translate(${margin.left}, ${margin.top})`)

  let cells = chart.selectAll('rect')
    .data(cellData)
    .enter()
    .append('rect')
    .attr('x', d => d.x)
    .attr('y', d => d.y)
    .attr('width', d => Math.max(0, d.width))
    .attr('height', d => Math.max(0, d.height))
    .attr('fill', d => colorScale(d.genre))
    .attr('stroke', '#fff')
    .attr('stroke-width', 1)
    .style('cursor', 'pointer')

  let tooltip = d3.select('body')
    .append('div')
    .style('position', 'absolute')
    .style('background', 'white')
    .style('border', '1px solid #b6b6b6ff')
    .style('padding', '10px')
    .style('border-radius', '4px')
    .style('font-size', '12px')
    .style('pointer-events', 'none')
    .style('opacity', 0)
    .style('box-shadow', '2px 2px 6px rgba(0,0,0,0.15)')

  cells.on('mouseover', function (event, d) {
    d3.select(this)
      .transition()
      .attr('stroke', '#000000ff')
      .attr('stroke-width', 2)
      .duration(100)

    tooltip
      .style('opacity', 1)
      .html(`
        <strong>${d.publisher}</strong><br>
        Type: ${d.genre}<br>
        Count: ${d.count}<br>
        Percent: ${d.percent.toFixed(1)}%<br>
        Top Platform: ${d.platform}
      `)
      .style('left', (event.pageX + 10) + 'px')
      .style('top', (event.pageY - 10) + 'px')
  })

  cells.on('mouseout', function () {
    d3.select(this)
      .transition()
      .attr('stroke', '#ffffffff')
      .attr('stroke-width', 1)
      .duration(200)

    tooltip.style('opacity', 0)
  })

  publishers.forEach(pub => {
    let x = publisherX.get(pub) + publisherWidth.get(pub) / 2
    chart.append('text')
      .attr('x', x + 25)
      .attr('y', -30)
      .attr('text-anchor', 'middle')
      .attr('font-size', '11px')
      .attr('transform', `rotate(-45, ${x}, -10)`)
      .text(pub)
  })

  let legend = svg.append('g')
    .attr('transform', `translate(${width - margin.right + 20}, ${margin.top})`)

  legend.append('text')
    .attr('x', 0)
    .attr('y', 0)
    .attr('font-size', '11px')
    .attr('font-weight', 'bold')
    .text('Genre')

  genres.forEach((genre, i) => {
    legend.append('rect')
      .attr('x', 0)
      .attr('y', i * 22 + 10)
      .attr('width', 16)
      .attr('height', 16)
      .attr('fill', colorScale(genre))

    legend.append('text')
      .attr('x', 22)
      .attr('y', i * 22 + 22)
      .attr('font-size', '10px')
      .text(genre)
  })

})