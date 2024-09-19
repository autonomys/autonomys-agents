import argparse
import sys
import logging
from content_creation.article_generator import generate_article, save_article

logging.basicConfig(level=logging.INFO)


def main():
    parser = argparse.ArgumentParser(description="Generate a web3 article draft")
    parser.add_argument("topic", type=str, help="Topic to write about")
    args = parser.parse_args()

    try:
        logging.info(f"Generating article on topic: {args.topic}")
        # Unpack four returned values
        article_content, fact_check_report, research_info, final_article_content = (
            generate_article(args.topic)
        )

        # Check for research errors
        if research_info.startswith("Error"):
            logging.error(f"Research failed: {research_info}")
            print(f"Research failed: {research_info}")
            sys.exit(1)  # Exiting as research is crucial for article generation

        # Save all reports including the research report
        article_file, fact_check_file, research_file, final_article_file = save_article(
            args.topic,
            article_content,
            fact_check_report,
            final_article_content,
            research_info,
        )

        print(f"Generated article draft on topic: {args.topic}")
        print(f"Draft saved to: {article_file}")
        print(f"Fact-check report saved to: {fact_check_file}")
        print(f"Research report saved to: {research_file}")
        print(f"Final article saved to: {final_article_file}")

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        print(f"An error occurred: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
