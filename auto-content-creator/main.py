import argparse
import sys
import logging
from article_generator import generate_article, save_article

logging.basicConfig(level=logging.INFO)


def main():
    parser = argparse.ArgumentParser(description="Generate a web3 article draft")
    parser.add_argument("topic", type=str, help="Topic to write about")
    args = parser.parse_args()

    try:
        logging.info(f"Generating article on topic: {args.topic}")
        article_content, fact_check_report = generate_article(args.topic)

        if article_content.startswith("Error"):
            logging.error(f"Failed to generate article: {article_content}")
            print(f"Failed to generate article: {article_content}")
            sys.exit(1)

        article_file, fact_check_file = save_article(
            args.topic, article_content, fact_check_report
        )

        print(f"Generated article draft on topic: {args.topic}")
        print(f"Article saved to: {article_file}")
        print(f"Fact-check report saved to: {fact_check_file}")

        if fact_check_report is None or fact_check_report.startswith("Error"):
            logging.warning(f"Fact-check report contains an error: {fact_check_report}")
            print(
                f"Warning: Fact-check report contains an error. Please check {fact_check_file}"
            )

    except Exception as e:
        logging.error(f"An error occurred: {str(e)}")
        print(f"An error occurred: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
