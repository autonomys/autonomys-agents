import { DynamicStructuredTool } from '@langchain/core/tools';
import { z } from 'zod';
import axios from 'axios';
import { parseStringPromise } from 'xml2js';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('arxiv-tool');

interface ArxivEntry {
  id: string[];
  title: string[];
  author: Array<{ name: string[] }>;
  published: string[];
  summary: string[];
}

interface ArxivResponse {
  feed: {
    entry?: ArxivEntry[];
  };
}

export const createArxivSearchTool = () =>
  new DynamicStructuredTool({
    name: 'arxiv_search',
    description: `
    Query the arXiv API with advanced filters, including sorting, categories, and author filtering.  
    USE THIS WHEN:  
    - The user asks for research papers with specific constraints.
    OUTPUT: Returns an array of papers with title, authors, publication date, summary, arXiv link, and direct PDF download link.`,
    schema: z.object({
      query: z.string().describe(`The search query for retrieving arXiv papers.`),
      category: z
        .string()
        .optional()
        .describe(
          `Specify an arXiv category to filter results: 
        - "astro-ph" (Astrophysics)
        - "astro-ph.GA" (Astrophysics of Galaxies)
        - "astro-ph.CO" (Cosmology and Nongalactic Astrophysics)
        - "astro-ph.EP" (Earth and Planetary Astrophysics)
        - "astro-ph.HE" (High Energy Astrophysical Phenomena)
        - "astro-ph.IM" (Instrumentation and Methods for Astrophysics)
        - "astro-ph.SR" (Solar and Stellar Astrophysics)
        - "cond-mat" (Condensed Matter)
        - "cond-mat.dis-nn" (Disordered Systems and Neural Networks)
        - "cond-mat.mtrl-sci" (Materials Science)
        - "cond-mat.mes-hall" (Mesoscale and Nanoscale Physics)
        - "cond-mat.other" (Other Condensed Matter)
        - "cond-mat.quant-gas" (Quantum Gases)
        - "cond-mat.soft" (Soft Condensed Matter)
        - "cond-mat.stat-mech" (Statistical Mechanics)
        - "cond-mat.str-el" (Strongly Correlated Electrons)
        - "cond-mat.supr-con" (Superconductivity)
        - "cs.AI" (Artificial Intelligence)
        - "cs.AR" (Hardware Architecture)
        - "cs.CC" (Computational Complexity)
        - "cs.CE" (Computational Engineering, Finance, and Science)
        - "cs.CG" (Computational Geometry)
        - "cs.CL" (Computation and Language)
        - "cs.CR" (Cryptography and Security)
        - "cs.CV" (Computer Vision and Pattern Recognition)
        - "cs.CY" (Computers and Society)
        - "cs.DB" (Databases)
        - "cs.DC" (Distributed, Parallel, and Cluster Computing)
        - "cs.DL" (Digital Libraries)
        - "cs.DM" (Discrete Mathematics)
        - "cs.DS" (Data Structures and Algorithms)
        - "cs.ET" (Emerging Technologies)
        - "cs.FL" (Formal Languages and Automata Theory)
        - "cs.GL" (General Literature)
        - "cs.GR" (Graphics)
        - "cs.GT" (Computer Science and Game Theory)
        - "cs.HC" (Human-Computer Interaction)
        - "cs.IR" (Information Retrieval)
        - "cs.IT" (Information Theory)
        - "cs.LG" (Machine Learning)
        - "cs.LO" (Logic in Computer Science)
        - "cs.MA" (Multiagent Systems)
        - "cs.MM" (Multimedia)
        - "cs.MS" (Mathematical Software)
        - "cs.NA" (Numerical Analysis)
        - "cs.NE" (Neural and Evolutionary Computing)
        - "cs.NI" (Networking and Internet Architecture)
        - "cs.OH" (Other Computer Science)
        - "cs.OS" (Operating Systems)
        - "cs.PF" (Performance)
        - "cs.PL" (Programming Languages)
        - "cs.RO" (Robotics)
        - "cs.SC" (Symbolic Computation)
        - "cs.SD" (Sound)
        - "cs.SE" (Software Engineering)
        - "cs.SI" (Social and Information Networks)
        - "cs.SY" (Systems and Control)
        - "econ.EM" (Econometrics)
        - "eess.AS" (Audio and Speech Processing)
        - "eess.IV" (Image and Video Processing)
        - "eess.SP" (Signal Processing)
        - "math.AC" (Commutative Algebra)
        - "math.AG" (Algebraic Geometry)
        - "math.AP" (Analysis of PDEs)
        - "math.AT" (Algebraic Topology)
        - "math.CA" (Classical Analysis and ODEs)
        - "math.CO" (Combinatorics)
        - "math.CT" (Category Theory)
        - "math.CV" (Complex Variables)
        - "math.DG" (Differential Geometry)
        - "math.DS" (Dynamical Systems)
        - "math.FA" (Functional Analysis)
        - "math.GM" (General Mathematics)
        - "math.GN" (General Topology)
        - "math.GR" (Group Theory)
        - "math.GT" (Geometric Topology)
        - "math.HO" (History and Overview)
        - "math.IT" (Information Theory)
        - "math.KT" (K-Theory and Homology)
        - "math.LO" (Logic)
        - "math.MG" (Metric Geometry)
        - "math.NA" (Numerical Analysis)
        - "math.NT" (Number Theory)
        - "math.OA" (Operator Algebras)
        - "math.OC" (Optimization and Control)
        - "math.PR" (Probability)
        - "math.QA" (Quantum Algebra)
        - "math.RA" (Rings and Algebras)
        - "math.RT" (Representation Theory)
        - "math.SG" (Symplectic Geometry)
        - "math.SP" (Spectral Theory)
        - "math.ST" (Statistics Theory)
        - "nlin.AO" (Adaptation and Self-Organizing Systems)
        - "nlin.CD" (Chaotic Dynamics)
        - "nlin.CG" (Cellular Automata and Lattice Gases)
        - "nlin.PS" (Pattern Formation and Solitons)
        - "nlin.SI" (Exactly Solvable and Integrable Systems)
        - "physics.acc-ph" (Accelerator Physics)
        - "physics.ao-ph" (Atmospheric and Oceanic Physics)
        - "physics.app-ph" (Applied Physics)
        - "physics.atm-clus" (Atomic and Molecular Clusters)
        - "physics.bio-ph" (Biological Physics)
        - "physics.chem-ph" (Chemical Physics)
        - "physics.class-ph" (Classical Physics)
        - "physics.comp-ph" (Computational Physics)
        - "physics.data-an" (Data Analysis, Statistics, and Probability)
        - "physics.flu-dyn" (Fluid Dynamics)
        - "physics.gen-ph" (General Physics)
        - "physics.geo-ph" (Geophysics)
        - "physics.hist-ph" (History and Philosophy of Physics)
        - "physics.ins-det" (Instrumentation and Detectors)
        - "physics.med-ph" (Medical Physics)
        - "physics.optics" (Optics)
        - "physics.plasm-ph" (Plasma Physics)
        - "physics.pop-ph" (Popular Physics)
        - "physics.soc-ph" (Physics and Society)
        - "physics.space-ph" (Space Physics)
        - "quant-ph" (Quantum Physics)
        - "stat.AP" (Applications)
        - "stat.CO" (Computation)
        - "stat.ME" (Methodology)
        - "stat.OT" (Other Statistics)
        - "stat.TH" (Theory)
        - Leave empty to search all categories.`,
        ),
      author: z.string().optional().describe(`Search for papers by a specific author"`),
      sortBy: z
        .enum(['relevance', 'lastUpdatedDate', 'submittedDate'])
        .default('relevance')
        .describe(
          `Sort results by:
        - "relevance" (default)
        - "lastUpdatedDate"
        - "submittedDate"`,
        ),
      maxResults: z
        .number()
        .default(5)
        .describe(`Maximum number of papers to retrieve. Default is 5. Max limit is 50.`),
    }),
    func: async ({
      query,
      category,
      author,
      sortBy,
      maxResults,
    }: {
      query: string;
      category?: string;
      author?: string;
      sortBy: string;
      maxResults: number;
    }) => {
      try {
        const queryTerms = query
          .trim()
          .split(/\s+/)
          .filter(term => term !== 'AND' && Boolean(term));

        const parts = [
          ...queryTerms,
          category ? `cat:${category}` : '',
          author ? `au:${encodeURIComponent(author)}` : '',
        ].filter(Boolean);

        const searchQuery = parts.join('+AND+');
        const url = `http://export.arxiv.org/api/query?search_query=${searchQuery}&start=0&max_results=${maxResults}&sortBy=${sortBy}`;

        logger.info(`Fetching papers from arXiv: ${url}`);

        const response = await axios.get(url);
        const result = (await parseStringPromise(response.data)) as ArxivResponse;

        if (!result.feed || !result.feed.entry) {
          logger.info('No papers found.');
          return [];
        }

        const papers = result.feed.entry.slice(0, maxResults).map((entry: ArxivEntry) => {
          const paperId = entry.id[0].split('/abs/')[1];
          return {
            title: entry.title[0],
            authors: entry.author.map(a => a.name[0]),
            published: entry.published[0],
            summary: entry.summary[0],
            link: entry.id[0],
            pdf_link: `https://arxiv.org/pdf/${paperId}.pdf`,
          };
        });

        logger.info(`Found ${papers.length} papers.`);
        return papers;
      } catch (error) {
        logger.error('Error fetching data from arXiv API:', error);
        return [];
      }
    },
  });
