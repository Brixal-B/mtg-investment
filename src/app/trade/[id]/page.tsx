import TradingPage from '@/components/TradingPage';

interface TradeDetailsPageProps {
  params: {
    id: string;
  };
}

export default function TradeDetailsPage({ params }: TradeDetailsPageProps) {
  return <TradingPage tradeId={params.id} />;
}
