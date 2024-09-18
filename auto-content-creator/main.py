import argparse
import sys
from article_generator import generate_article, save_article


def main():
    parser = argparse.ArgumentParser(description="Generate a web3 article draft")
    parser.add_argument("topic", type=str, help="Topic to write about")
    args = parser.parse_args()

    try:
        article_content = generate_article(args.topic)

        if article_content.startswith("Error"):
            print(f"Failed to generate article: {article_content}")
            sys.exit(1)

        file_name = save_article(args.topic, article_content)

        print(f"Generated article draft on topic: {args.topic}")
        print(f"Article saved to: {file_name}")
    except Exception as e:
        print(f"An error occurred: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()
