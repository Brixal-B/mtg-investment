import TradingPage from '@/components/TradingPage';

interface TradeDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function TradeDetailsPage({ params }: TradeDetailsPageProps) {
  const { id } = await params;
  return <TradingPage tradeId={id} />;
}
